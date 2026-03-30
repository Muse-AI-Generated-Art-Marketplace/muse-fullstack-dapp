import { Request, Response, NextFunction } from 'express'

export const validateSearchQuery = (type: 'artworks' | 'users') => {
  return (req: Request, res: Response, next: NextFunction) => {
    const { q, page, limit, sort } = req.query

    // Validate search query
    if (q && typeof q !== 'string') {
      return res.status(400).json({
        success: false,
        error: 'Search query must be a string'
      })
    }

    // Validate page
    if (page !== undefined) {
      const pageNum = parseInt(page as string)
      if (isNaN(pageNum) || pageNum < 1) {
        return res.status(400).json({
          success: false,
          error: 'Page must be a positive integer'
        })
      }
    }

    // Validate limit
    if (limit !== undefined) {
      const limitNum = parseInt(limit as string)
      if (isNaN(limitNum) || limitNum < 1 || limitNum > 100) {
        return res.status(400).json({
          success: false,
          error: 'Limit must be between 1 and 100'
        })
      }
    }

    // Validate sort
    const validSorts = {
      artworks: ['relevance', 'price_asc', 'price_desc', 'newest', 'oldest'],
      users: ['relevance', 'newest', 'oldest']
    }

    if (sort && !validSorts[type].includes(sort as string)) {
      return res.status(400).json({
        success: false,
        error: `Invalid sort option. Must be one of: ${validSorts[type].join(', ')}`
      })
    }

    // Validate filters based on type
    if (type === 'artworks') {
      const { category, priceMin, priceMax, artist, createdAfter, createdBefore } = req.query

      // Validate category
      if (category && typeof category !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Category must be a string'
        })
      }

      // Validate price range
      if (priceMin !== undefined) {
        const priceMinNum = parseFloat(priceMin as string)
        if (isNaN(priceMinNum) || priceMinNum < 0) {
          return res.status(400).json({
            success: false,
            error: 'priceMin must be a non-negative number'
          })
        }
      }

      if (priceMax !== undefined) {
        const priceMaxNum = parseFloat(priceMax as string)
        if (isNaN(priceMaxNum) || priceMaxNum < 0) {
          return res.status(400).json({
            success: false,
            error: 'priceMax must be a non-negative number'
          })
        }
      }

      if (priceMin !== undefined && priceMax !== undefined) {
        const priceMinNum = parseFloat(priceMin as string)
        const priceMaxNum = parseFloat(priceMax as string)
        if (priceMinNum > priceMaxNum) {
          return res.status(400).json({
            success: false,
            error: 'priceMin cannot be greater than priceMax'
          })
        }
      }

      // Validate artist
      if (artist && typeof artist !== 'string') {
        return res.status(400).json({
          success: false,
          error: 'Artist must be a string'
        })
      }

      // Validate date range
      if (createdAfter !== undefined) {
        const date = new Date(createdAfter as string)
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'createdAfter must be a valid date'
          })
        }
      }

      if (createdBefore !== undefined) {
        const date = new Date(createdBefore as string)
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'createdBefore must be a valid date'
          })
        }
      }

      if (createdAfter !== undefined && createdBefore !== undefined) {
        const afterDate = new Date(createdAfter as string)
        const beforeDate = new Date(createdBefore as string)
        if (afterDate > beforeDate) {
          return res.status(400).json({
            success: false,
            error: 'createdAfter cannot be greater than createdBefore'
          })
        }
      }

    } else if (type === 'users') {
      const { role, joinedAfter, joinedBefore, hasListings } = req.query

      // Validate role
      if (role && !['free', 'pro', 'premium'].includes(role as string)) {
        return res.status(400).json({
          success: false,
          error: 'Role must be one of: free, pro, premium'
        })
      }

      // Validate date range
      if (joinedAfter !== undefined) {
        const date = new Date(joinedAfter as string)
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'joinedAfter must be a valid date'
          })
        }
      }

      if (joinedBefore !== undefined) {
        const date = new Date(joinedBefore as string)
        if (isNaN(date.getTime())) {
          return res.status(400).json({
            success: false,
            error: 'joinedBefore must be a valid date'
          })
        }
      }

      if (joinedAfter !== undefined && joinedBefore !== undefined) {
        const afterDate = new Date(joinedAfter as string)
        const beforeDate = new Date(joinedBefore as string)
        if (afterDate > beforeDate) {
          return res.status(400).json({
            success: false,
            error: 'joinedAfter cannot be greater than joinedBefore'
          })
        }
      }

      // Validate hasListings
      if (hasListings !== undefined && hasListings !== 'true' && hasListings !== 'false') {
        return res.status(400).json({
          success: false,
          error: 'hasListings must be true or false'
        })
      }
    }

    next()
  }
}
