import { ErrorHandler } from '@/utils/errorHandler'

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001'

export interface GenerateImageRequest {
    prompt: string
    style?: string
    quality?: 'standard' | 'hd'
    size?: '1024x1024' | '1792x1024' | '1024x1792'
}

export interface GenerateImageResponse {
    generationId: string
    status: 'processing' | 'completed' | 'failed'
    prompt: string
    style?: string
    quality?: string
    estimatedTime?: string
}

export interface GenerationStatus {
    generationId: string
    status: 'processing' | 'completed' | 'failed'
    progress: number
    imageUrl: string | null
    error: string | null
}

export const aiService = {
    /**
     * Generate an AI image from a text prompt
     */
    async generateImage(request: GenerateImageRequest): Promise<GenerateImageResponse> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/generate`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(request),
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw ErrorHandler.createError(
                    'AI_GENERATION_FAILED',
                    errorData.message || 'Failed to generate image',
                    response.status
                )
            }

            const data = await response.json()
            return data.data
        } catch (error) {
            throw ErrorHandler.handleError(error, {
                context: 'aiService.generateImage',
                userMessage: 'Failed to start AI image generation. Please try again.',
            })
        }
    },

    /**
     * Check the status of an image generation
     */
    async getGenerationStatus(generationId: string): Promise<GenerationStatus> {
        try {
            const response = await fetch(`${API_BASE_URL}/api/ai/status/${generationId}`, {
                method: 'GET',
                headers: {
                    'Content-Type': 'application/json',
                },
            })

            if (!response.ok) {
                const errorData = await response.json().catch(() => ({}))
                throw ErrorHandler.createError(
                    'STATUS_CHECK_FAILED',
                    errorData.message || 'Failed to check generation status',
                    response.status
                )
            }

            const data = await response.json()
            return data.data
        } catch (error) {
            throw ErrorHandler.handleError(error, {
                context: 'aiService.getGenerationStatus',
                userMessage: 'Failed to check generation status. Please try again.',
            })
        }
    },

    /**
     * Poll for generation status until completion or failure
     */
    async pollGenerationStatus(
        generationId: string,
        onProgress?: (status: GenerationStatus) => void,
        maxAttempts: number = 60,
        intervalMs: number = 2000
    ): Promise<GenerationStatus> {
        let attempts = 0

        return new Promise((resolve, reject) => {
            const poll = async () => {
                try {
                    attempts++
                    const status = await this.getGenerationStatus(generationId)

                    if (onProgress) {
                        onProgress(status)
                    }

                    if (status.status === 'completed') {
                        resolve(status)
                        return
                    }

                    if (status.status === 'failed') {
                        reject(
                            ErrorHandler.createError(
                                'GENERATION_FAILED',
                                status.error || 'Image generation failed',
                                500
                            )
                        )
                        return
                    }

                    if (attempts >= maxAttempts) {
                        reject(
                            ErrorHandler.createError(
                                'GENERATION_TIMEOUT',
                                'Image generation timed out',
                                408
                            )
                        )
                        return
                    }

                    setTimeout(poll, intervalMs)
                } catch (error) {
                    reject(error)
                }
            }

            poll()
        })
    },
}

export default aiService
