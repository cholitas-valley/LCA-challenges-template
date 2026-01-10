import { useState } from 'react';
import { useCreatePlant } from '../hooks';
import { Button } from './ui';

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
                    Plant Name <span className="text-status-error">*</span>
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
                  <div className="rounded-md bg-status-error-light p-3 border border-status-error">
                    <p className="text-sm text-status-error-text">
                      Failed to create plant. Please try again.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Footer */}
            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
              <Button
                type="submit"
                variant="primary"
                loading={createPlant.isPending}
                disabled={!name.trim()}
                className="w-full sm:w-auto"
              >
                {createPlant.isPending ? 'Creating...' : 'Create Plant'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={createPlant.isPending}
                className="mt-3 sm:mt-0 w-full sm:w-auto"
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}
