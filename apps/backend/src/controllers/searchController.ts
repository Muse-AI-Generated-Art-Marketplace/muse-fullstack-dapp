import { Request, Response } from 'express'
import { searchService } from '@/services/searchService'

export const searchArtworks = async (req: Request, res: Response) => {
  try {
    const {
      q,
      category,
      priceMin,
      priceMax,
      artist,
      createdAfter,
      createdBefore,
      page,
      limit,
      sort
    } = req.query

    // Parse filters
    const filters: any = {}
    if (category) filters.category = category as string
    if (priceMin) filters.priceMin = parseFloat(priceMin as string)
    if (priceMax) filters.priceMax = parseFloat(priceMax as string)
    if (artist) filters.artist = artist as string
    if (createdAfter) filters.createdAfter = new Date(createdAfter as string)
    if (createdBefore) filters.createdBefore = new Date(createdBefore as string)

    // Parse options
    const options: any = {}
    if (q) options.q = q as string
    if (page) options.page = parseInt(page as string)
    if (limit) options.limit = parseInt(limit as string)
    if (sort) options.sort = sort as string

    const result = await searchService.searchArtworks(
      options.q,
      filters,
      options
    )

    res.status(200).json(result)
  } catch (error) {
    console.error('Error searching artworks:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}

export const searchUsers = async (req: Request, res: Response) => {
  try {
    const {
      q,
      role,
      joinedAfter,
      joinedBefore,
      hasListings,
      page,
      limit,
      sort
    } = req.query

    // Parse filters
    const filters: any = {}
    if (role) filters.role = role as string
    if (joinedAfter) filters.joinedAfter = new Date(joinedAfter as string)
    if (joinedBefore) filters.joinedBefore = new Date(joinedBefore as string)
    if (hasListings !== undefined) {
      filters.hasListings = hasListings === 'true'
    }

    // Parse options
    const options: any = {}
    if (q) options.q = q as string
    if (page) options.page = parseInt(page as string)
    if (limit) options.limit = parseInt(limit as string)
    if (sort) options.sort = sort as string

    const result = await searchService.searchUsers(
      options.q,
      filters,
      options
    )

    res.status(200).json(result)
  } catch (error) {
    console.error('Error searching users:', error)
    res.status(500).json({
      success: false,
      error: 'Internal server error'
    })
  }
}
