import { Response, NextFunction } from 'express'
import { createLogger } from '@/utils/logger'
import { malwareScanService } from '@/services/malwareScanService'
import { createValidationError, createError } from '@/middleware/errorHandler'
import { AuthRequest } from '@/middleware/authMiddleware'

const logger = createLogger('SecurityController')

// ── GET /api/security/scan-stats ───────────────────────────────────────────────
export const getScanStats = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    // Check if user has admin privileges
    if (req.user?.tier !== 'premium' && req.user?.tier !== 'pro') {
      return next(createError('Admin access required', 403, 'FORBIDDEN'))
    }

    log.info('Getting malware scan statistics')

    const stats = malwareScanService.getScanStats()

    log.info('Scan statistics retrieved', stats)

    res.json({
      success: true,
      data: {
        stats,
        message: 'Scan statistics retrieved successfully',
      },
    })
  } catch (error) {
    log.error('Failed to get scan statistics', { error })
    next(createValidationError('Failed to get scan statistics'))
  }
}

// ── GET /api/security/quarantine ─────────────────────────────────────────────────
export const getQuarantineList = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    // Check if user has admin privileges
    if (req.user?.tier !== 'premium' && req.user?.tier !== 'pro') {
      return next(createError('Admin access required', 403, 'FORBIDDEN'))
    }

    log.info('Getting quarantine list')

    const quarantineList = malwareScanService.getQuarantineList()

    log.info('Quarantine list retrieved', { count: quarantineList.length })

    res.json({
      success: true,
      data: {
        quarantineList,
        count: quarantineList.length,
        message: `${quarantineList.length} files in quarantine`,
      },
    })
  } catch (error) {
    log.error('Failed to get quarantine list', { error })
    next(createValidationError('Failed to get quarantine list'))
  }
}

// ── DELETE /api/security/quarantine ───────────────────────────────────────────────
export const clearQuarantineList = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    // Check if user has admin privileges
    if (req.user?.tier !== 'premium' && req.user?.tier !== 'pro') {
      return next(createError('Admin access required', 403, 'FORBIDDEN'))
    }

    log.info('Clearing quarantine list')

    const beforeCount = malwareScanService.getQuarantineList().length
    malwareScanService.clearQuarantineList()
    const afterCount = malwareScanService.getQuarantineList().length

    log.info('Quarantine list cleared', { beforeCount, afterCount })

    res.json({
      success: true,
      data: {
        clearedCount: beforeCount,
        message: `Successfully cleared ${beforeCount} files from quarantine`,
      },
    })
  } catch (error) {
    log.error('Failed to clear quarantine list', { error })
    next(createValidationError('Failed to clear quarantine list'))
  }
}

// ── POST /api/security/scan-file ─────────────────────────────────────────────────
export const scanFileManually = async (req: AuthRequest, res: Response, next: NextFunction) => {
  const log = logger.child({ requestId: req.requestId })
  
  try {
    // Check if user has admin privileges
    if (req.user?.tier !== 'premium' && req.user?.tier !== 'pro') {
      return next(createError('Admin access required', 403, 'FORBIDDEN'))
    }

    const { fileBuffer, originalName, mimeType } = req.body

    if (!fileBuffer || !originalName || !mimeType) {
      return res.status(400).json({
        success: false,
        error: 'Missing required parameters',
        message: 'fileBuffer, originalName, and mimeType are required',
      })
    }

    log.info('Starting manual file scan', { originalName, mimeType })

    const buffer = Buffer.from(fileBuffer, 'base64')
    const scanResult = await malwareScanService.scanFile(
      buffer,
      originalName,
      mimeType,
      req.user?.address
    )

    log.info('Manual file scan completed', {
      originalName,
      isClean: scanResult.isClean,
      threatsCount: scanResult.threats.length,
      riskLevel: scanResult.riskLevel,
    })

    res.json({
      success: true,
      data: {
        scanResult,
        message: 'File scan completed successfully',
      },
    })
  } catch (error) {
    log.error('Failed to scan file manually', { error })
    next(createValidationError('Failed to scan file'))
  }
}

export default {
  getScanStats,
  getQuarantineList,
  clearQuarantineList,
  scanFileManually,
}
