
export interface Metadata {
  title: string
  description: string
  category: string
  tags: string[]
  price: string
  royalty: string
}

export interface MetadataFormProps {
  metadata: Metadata
  onChange: (metadata: Metadata) => void
}

export function MetadataForm({ metadata, onChange }: MetadataFormProps) {
  const update = (field: keyof Metadata, value: string | string[]) =>
    onChange({ ...metadata, [field]: value })

  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Title *
        </label>
        <input
          type="text"
          value={metadata.title}
          onChange={(e) => update('title', e.target.value)}
          placeholder="Enter artwork title"
          className="input w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Description *
        </label>
        <textarea
          value={metadata.description}
          onChange={(e) => update('description', e.target.value)}
          placeholder="Describe your artwork..."
          className="input w-full h-32 resize-none"
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Category *
          </label>
          <select
            value={metadata.category}
            onChange={(e) => update('category', e.target.value)}
            className="input w-full"
          >
            <option value="">Select category</option>
            <option value="digital-art">Digital Art</option>
            <option value="photography">Photography</option>
            <option value="illustration">Illustration</option>
            <option value="3d-art">3D Art</option>
            <option value="animation">Animation</option>
            <option value="music">Music</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-secondary-700 mb-2">
            Price (ETH) *
          </label>
          <input
            type="number"
            value={metadata.price}
            onChange={(e) => update('price', e.target.value)}
            placeholder="0.0"
            step="0.01"
            min="0"
            className="input w-full"
          />
        </div>
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Tags
        </label>
        <input
          type="text"
          value={metadata.tags.join(', ')}
          onChange={(e) =>
            update(
              'tags',
              e.target.value
                .split(',')
                .map((tag) => tag.trim())
                .filter(Boolean)
            )
          }
          placeholder="art, digital, creative (comma separated)"
          className="input w-full"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-secondary-700 mb-2">
          Royalty (%)
        </label>
        <input
          type="number"
          value={metadata.royalty}
          onChange={(e) => update('royalty', e.target.value)}
          min="0"
          max="50"
          className="input w-full"
        />
      </div>
    </div>
  )
}
