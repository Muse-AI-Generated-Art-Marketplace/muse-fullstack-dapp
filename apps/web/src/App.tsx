import { useState } from 'react'

function App() {
  const [count, setCount] = useState(0)

  return (
    <div className="min-h-screen bg-gray-100 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-lg p-8">
          <h1 className="text-4xl font-bold text-center text-gray-800 mb-8">
            Muse Web Application
          </h1>
          
          <div className="text-center">
            <p className="text-gray-600 mb-6">
              Welcome to your TypeScript + Tailwind CSS web application!
            </p>
            
            <div className="bg-blue-50 rounded-lg p-6 mb-6">
              <h2 className="text-xl font-semibold text-blue-800 mb-4">
                Interactive Counter Demo
              </h2>
              <div className="flex items-center justify-center space-x-4">
                <button
                  onClick={() => setCount(count - 1)}
                  className="px-4 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition-colors"
                >
                  Decrease
                </button>
                <span className="text-2xl font-bold text-blue-600">{count}</span>
                <button
                  onClick={() => setCount(count + 1)}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600 transition-colors"
                >
                  Increase
                </button>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-purple-100 rounded-lg p-4">
                <h3 className="font-semibold text-purple-800 mb-2">TypeScript</h3>
                <p className="text-sm text-purple-600">Type-safe development</p>
              </div>
              <div className="bg-pink-100 rounded-lg p-4">
                <h3 className="font-semibold text-pink-800 mb-2">Tailwind CSS</h3>
                <p className="text-sm text-pink-600">Utility-first styling</p>
              </div>
              <div className="bg-indigo-100 rounded-lg p-4">
                <h3 className="font-semibold text-indigo-800 mb-2">React + Vite</h3>
                <p className="text-sm text-indigo-600">Fast development experience</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
