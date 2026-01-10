import { useState } from 'react';
import { useRegisterDevice } from '../hooks';
import { Button } from './ui/Button';

interface RegisterDeviceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RegisterDeviceModal({ isOpen, onClose }: RegisterDeviceModalProps) {
  const [macAddress, setMacAddress] = useState('');
  const registerDevice = useRegisterDevice();

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!macAddress.trim()) {
      return;
    }

    try {
      await registerDevice.mutateAsync({
        mac_address: macAddress.trim(),
      });

      setMacAddress('');
      onClose();
    } catch (error) {
      console.error('Failed to register device:', error);
    }
  };

  const handleClose = () => {
    setMacAddress('');
    onClose();
  };

  const generateMac = () => {
    const hex = () => Math.floor(Math.random() * 256).toString(16).padStart(2, '0');
    setMacAddress(`${hex()}:${hex()}:${hex()}:${hex()}:${hex()}:${hex()}`);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto" aria-labelledby="modal-title" role="dialog" aria-modal="true">
      <div className="flex items-center justify-center min-h-screen px-4 pt-4 pb-20 text-center sm:block sm:p-0">
        <div
          className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity"
          aria-hidden="true"
          onClick={handleClose}
        />

        <span className="hidden sm:inline-block sm:align-middle sm:h-screen" aria-hidden="true">&#8203;</span>

        <div className="inline-block align-bottom bg-white rounded-lg text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full">
          <form onSubmit={handleSubmit}>
            <div className="bg-white px-4 pt-5 pb-4 sm:p-6 sm:pb-4">
              <h3 className="text-lg font-medium leading-6 text-gray-900 mb-4" id="modal-title">
                Register New Device
              </h3>

              <div className="space-y-4">
                <div>
                  <label htmlFor="mac-address" className="block text-sm font-medium text-gray-700 mb-1">
                    MAC Address <span className="text-status-error">*</span>
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      id="mac-address"
                      value={macAddress}
                      onChange={(e) => setMacAddress(e.target.value)}
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-action-primary focus:border-action-primary"
                      placeholder="e.g., aa:bb:cc:dd:ee:ff"
                      required
                      autoFocus
                    />
                    <button
                      type="button"
                      onClick={generateMac}
                      className="px-3 py-2 border border-gray-300 rounded-md text-sm text-gray-700 hover:bg-gray-50"
                    >
                      Generate
                    </button>
                  </div>
                  <p className="mt-1 text-xs text-gray-500">
                    For testing, click Generate to create a random MAC address
                  </p>
                </div>

                {registerDevice.isError && (
                  <div className="rounded-md bg-status-error-light p-3 border border-status-error">
                    <p className="text-sm text-status-error-text">
                      Failed to register device. Please try again.
                    </p>
                  </div>
                )}
              </div>
            </div>

            <div className="bg-gray-50 px-4 py-3 sm:px-6 sm:flex sm:flex-row-reverse gap-3">
              <Button
                type="submit"
                variant="primary"
                disabled={!macAddress.trim()}
                loading={registerDevice.isPending}
                className="w-full sm:w-auto"
              >
                {registerDevice.isPending ? 'Registering...' : 'Register Device'}
              </Button>
              <Button
                type="button"
                variant="secondary"
                onClick={handleClose}
                disabled={registerDevice.isPending}
                className="mt-3 w-full sm:mt-0 sm:w-auto"
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
