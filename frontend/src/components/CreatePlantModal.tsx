import { useState } from 'react';
import { useCreatePlant } from '../hooks';

interface CreatePlantModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CreatePlantModal({ isOpen, onClose }: CreatePlantModalProps) {
  const [name, setName] = useState('');
  const [species, setSpecies] = useState('');
  const createPlant = useCreatePlant();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      return;
    }

    try {
      await createPlant.mutateAsync({
        name: name.trim(),
        species: species.trim() || undefined,
      });
      
      // Reset form and close modal
      setName('');
      setSpecies('');
      onClose();
    } catch (error) {
      // Error is already handled by React Query
      console.error('Failed to create plant:', error);
    }
  };

  const handleClose = () => {
    setName('');
    setSpecies('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      {/* Backdrop */}
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div 
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" 
          aria-hidden="true"
          onClick={handleClose}
        />

        {/* Center modal */}
        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        {/* Modal panel */}
        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            {/* Header */}
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4" id="modal-title">
                Add New Plant
              </h3>

              {/* Form fields */}
              <div className="space-y-4">
                <div>
                  <label htmlFor="plant-name" className="block text-sm font-medium text-gray-700 mb-1">
                    Plant Name <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    id="plant-name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Monstera Deliciosa"
                    required
                    autoFocus
                  />
                </div>

                <div>
                  <label htmlFor="plant-species" className="block text-sm font-medium text-gray-700 mb-1">
                    Species (optional)
                  </label>
                  <input
                    type="text"
                    id="plant-species"
                    value={species}
                    onChange={(e) => setSpecies(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Monstera deliciosa"
                  />
                </div>

                {createPlant.isError && (
                  <div className="rounded-md bg-red-50 p-3 border border-red-200">
                    <p className="text-sm text-red-600">
                      Failed to create plant. Please try again.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
              <button
                type="submit"
                disabled={createPlant.isPending || !name.trim()}
                className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-green-600 text-base font-medium text-white hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {createPlant.isPending ? 'Creating...' : 'Create Plant'}
              </button>
              <button
                type="button"
                onClick={handleClose}
                disabled={createPlant.isPending}
                className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 sm:mt-0 sm:w-auto sm:text-sm disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
