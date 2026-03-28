import React from 'react'
import { Upload } from 'lucide-react'

export interface FileData {
  file: File | null
  preview: string | null
  type: string
}

export interface FileUploadProps {
  fileData: FileData
  onChange: (fileData: FileData) => void
  onClear: () => void
}

export function FileUpload({ fileData, onChange, onClear }: FileUploadProps) {
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (e) => {
      onChange({
        file,
        preview: e.target?.result as string,
        type: file.type,
      })
    }
    reader.readAsDataURL(file)
  }

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Upload File *
        </label>
        <div className="border-2 border-dashed border-secondary-300 rounded-lg p-8 text-center hover:border-primary-400 transition-colors">
          <input
            type="file"
            onChange={handleFileChange}
            accept="image/*,video/mp4"
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload" className="cursor-pointer">
            {fileData.preview ? (
              <div className="space-y-4">
                {fileData.type.startsWith('image/') ? (
                  <img
                    src={fileData.preview}
                    alt="Preview"
                    className="max-h-64 mx-auto rounded-lg"
                  />
                ) : (
                  <div className="aspect-video bg-gradient-to-br from-primary-100 to-primary-200 rounded-lg flex items-center justify-center">
                    <div className="text-center">
                      <Upload className="h-12 w-12 text-primary-400 mx-auto mb-2" />
                      <p className="text-primary-600">Video uploaded</p>
                    </div>
                  </div>
                )}
                <p className="text-sm text-secondary-600">
                  {fileData.file?.name} (
                  {((fileData.file?.size || 0) / 1024 / 1024).toFixed(2)} MB)
                </p>
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault()
                    onClear()
                  }}
                  className="text-red-600 hover:text-red-700 text-sm"
                >
                  Remove file
                </button>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className="h-12 w-12 text-secondary-400 mx-auto" />
                <div>
                  <p className="text-secondary-600">Click to upload or drag and drop</p>
                  <p className="text-sm text-secondary-500">
                    PNG, JPG, GIF, WebP, MP4 (MAX. 50MB)
                  </p>
                </div>
              </div>
            )}
          </label>
        </div>
      </div>

      <div className="card p-4">
        <h4 className="font-medium text-secondary-900 mb-2">File Requirements</h4>
        <ul className="text-sm text-secondary-600 space-y-1">
          <li>• Maximum file size: 50MB</li>
          <li>• Supported formats: PNG, JPG, GIF, WebP, MP4</li>
          <li>• Recommended resolution: 3000x3000 pixels for images</li>
          <li>• Video duration: Max 5 minutes</li>
        </ul>
      </div>
    </div>
  )
}
