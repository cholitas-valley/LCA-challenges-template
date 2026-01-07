import { useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import {
  Layout,
  LoadingSpinner,
  ErrorMessage,
  TelemetryChart,
  ThresholdForm,
  PlantDeviceList,
  ConfirmDialog
} from '../components';
import {
  usePlant,
  usePlantHistory,
  usePlantDevices,
  useUpdatePlant,
  useDeletePlant
} from '../hooks';
import { useProvisionDevice } from '../hooks/useDevices';
import type { PlantThresholds } from '../types';

export function PlantDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [isEditingName, setIsEditingName] = useState(false);
  const [editedName, setEditedName] = useState('');
  const [deleteDevice, setDeleteDevice] = useState<string | null>(null);

  // Fetch data
  const { data: plant, isLoading: plantLoading, error: plantError } = usePlant(id!);
  const { data: history, isLoading: historyLoading } = usePlantHistory(id!, 24);
  const { data: devices, isLoading: devicesLoading } = usePlantDevices(id!);

  // Mutations
  const updateMutation = useUpdatePlant();
  const deleteMutation = useDeletePlant();
  const provisionMutation = useProvisionDevice();

  if (plantLoading) {
    return (
      <Layout>
        <div className="flex items-center justify-center h-64">
          <LoadingSpinner />
        </div>
      </Layout>
    );
  }

  if (plantError || !plant) {
    return (
      <Layout>
        <ErrorMessage message="Failed to load plant details" />
      </Layout>
    );
  }

  const handleNameEdit = () => {
    setEditedName(plant.name);
    setIsEditingName(true);
  };

  const handleNameSave = async () => {
    if (editedName.trim() && editedName !== plant.name) {
      await updateMutation.mutateAsync({ id: id!, data: { name: editedName } });
    }
    setIsEditingName(false);
  };

  const handleNameCancel = () => {
    setIsEditingName(false);
    setEditedName('');
  };

  const handleThresholdSave = async (thresholds: PlantThresholds) => {
    await updateMutation.mutateAsync({ id: id!, data: { thresholds } });
  };

  const handleDeletePlant = async () => {
    await deleteMutation.mutateAsync(id!);
    navigate('/plants');
  };

  const handleUnassignDevice = async (deviceId: string) => {
    await provisionMutation.mutateAsync({ deviceId, data: { plant_id: '' } });
    setDeleteDevice(null);
  };

  const latestTelemetry = plant.latest_telemetry;
  const historyRecords = history?.records ?? [];

  const getStatusColor = (value: number | null, min: number | null, max: number | null) => {
    if (value === null) return 'text-gray-400';
    if (min !== null && value < min) return 'text-red-600';
    if (max !== null && value > max) return 'text-red-600';
    return 'text-green-600';
  };

  const formatThresholdRange = (min: number | null, max: number | null) => {
    if (min === null && max === null) return 'Not set';
    if (min === null) return `< ${max}`;
    if (max === null) return `> ${min}`;
    return `${min}-${max}`;
  };

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/" className="text-green-600 hover:text-green-700 text-sm font-medium">
            Dashboard
          </Link>
          <span className="text-gray-500 mx-2">/</span>
          <Link to="/plants" className="text-green-600 hover:text-green-700 text-sm font-medium">
            Plants
          </Link>
          <span className="text-gray-500 mx-2">/</span>
          <span className="text-gray-900 text-sm font-medium">{plant.name}</span>
        </div>

        {/* Header */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editedName}
                    onChange={(e) => setEditedName(e.target.value)}
                    className="text-3xl font-bold text-gray-900 border-b-2 border-green-500 focus:outline-none"
                    autoFocus
                  />
                  <button
                    onClick={handleNameSave}
                    className="px-3 py-1 bg-green-600 text-white text-sm rounded-md hover:bg-green-700"
                  >
                    Save
                  </button>
                  <button
                    onClick={handleNameCancel}
                    className="px-3 py-1 bg-gray-300 text-gray-700 text-sm rounded-md hover:bg-gray-400"
                  >
                    Cancel
                  </button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">{plant.name}</h1>
                  <button
                    onClick={handleNameEdit}
                    className="text-gray-500 hover:text-gray-700"
                    title="Edit name"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                    </svg>
                  </button>
                </div>
              )}
              {plant.species && (
                <p className="text-gray-600 mt-1">Species: {plant.species}</p>
              )}
              <p className="text-sm text-gray-500 mt-2">
                {plant.device_count} {plant.device_count === 1 ? 'device' : 'devices'} attached
              </p>
            </div>
            <div className="flex gap-2">
              <Link
                to={`/plants/${id}/care`}
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
              >
                View Care Plan
              </Link>
              <button
                onClick={handleDeletePlant}
                disabled={deleteMutation.isPending}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:bg-gray-400"
              >
                Delete Plant
              </button>
            </div>
          </div>
        </div>

        {/* Current Readings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Readings</h2>
          {latestTelemetry ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className={'text-4xl font-bold mb-2 ' + getStatusColor(
                  latestTelemetry.soil_moisture,
                  plant.thresholds?.soil_moisture?.min ?? null,
                  plant.thresholds?.soil_moisture?.max ?? null
                )}>
                  {latestTelemetry.soil_moisture !== null ? `${latestTelemetry.soil_moisture}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 font-medium">Soil Moisture</div>
                <div className="text-xs text-gray-500 mt-1">
                  ({formatThresholdRange(
                    plant.thresholds?.soil_moisture?.min ?? null,
                    plant.thresholds?.soil_moisture?.max ?? null
                  )})
                </div>
              </div>
              <div className="text-center">
                <div className={'text-4xl font-bold mb-2 ' + getStatusColor(
                  latestTelemetry.temperature,
                  plant.thresholds?.temperature?.min ?? null,
                  plant.thresholds?.temperature?.max ?? null
                )}>
                  {latestTelemetry.temperature !== null ? `${latestTelemetry.temperature}°C` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 font-medium">Temperature</div>
                <div className="text-xs text-gray-500 mt-1">
                  ({formatThresholdRange(
                    plant.thresholds?.temperature?.min ?? null,
                    plant.thresholds?.temperature?.max ?? null
                  )})
                </div>
              </div>
              <div className="text-center">
                <div className={'text-4xl font-bold mb-2 ' + getStatusColor(
                  latestTelemetry.humidity,
                  plant.thresholds?.humidity?.min ?? null,
                  plant.thresholds?.humidity?.max ?? null
                )}>
                  {latestTelemetry.humidity !== null ? `${latestTelemetry.humidity}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 font-medium">Humidity</div>
                <div className="text-xs text-gray-500 mt-1">
                  ({formatThresholdRange(
                    plant.thresholds?.humidity?.min ?? null,
                    plant.thresholds?.humidity?.max ?? null
                  )})
                </div>
              </div>
              <div className="text-center">
                <div className={'text-4xl font-bold mb-2 ' + getStatusColor(
                  latestTelemetry.light_level,
                  plant.thresholds?.light_level?.min ?? null,
                  plant.thresholds?.light_level?.max ?? null
                )}>
                  {latestTelemetry.light_level !== null ? latestTelemetry.light_level : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 font-medium">Light Level</div>
                <div className="text-xs text-gray-500 mt-1">
                  ({formatThresholdRange(
                    plant.thresholds?.light_level?.min ?? null,
                    plant.thresholds?.light_level?.max ?? null
                  )})
                </div>
              </div>
            </div>
          ) : (
            <p className="text-gray-500 text-center py-8">No telemetry data available</p>
          )}
        </div>

        {/* History Charts */}
        <div className="mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">24-Hour History</h2>
          {historyLoading ? (
            <div className="flex items-center justify-center h-64 bg-white rounded-lg shadow">
              <LoadingSpinner />
            </div>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <TelemetryChart
                data={historyRecords}
                metricKey="soil_moisture"
                metricLabel="Soil Moisture"
                threshold={plant.thresholds?.soil_moisture}
                unit="%"
              />
              <TelemetryChart
                data={historyRecords}
                metricKey="temperature"
                metricLabel="Temperature"
                threshold={plant.thresholds?.temperature}
                unit="°C"
              />
              <TelemetryChart
                data={historyRecords}
                metricKey="humidity"
                metricLabel="Humidity"
                threshold={plant.thresholds?.humidity}
                unit="%"
              />
              <TelemetryChart
                data={historyRecords}
                metricKey="light_level"
                metricLabel="Light Level"
                threshold={plant.thresholds?.light_level}
                unit=" lux"
              />
            </div>
          )}
        </div>

        {/* Threshold Configuration */}
        <div className="mb-6">
          <ThresholdForm
            thresholds={plant.thresholds}
            onSave={handleThresholdSave}
            isLoading={updateMutation.isPending}
          />
        </div>

        {/* Attached Devices */}
        <div className="mb-6">
          {devicesLoading ? (
            <div className="flex items-center justify-center h-32 bg-white rounded-lg shadow">
              <LoadingSpinner />
            </div>
          ) : (
            <PlantDeviceList
              devices={devices?.devices ?? []}
              onUnassign={(deviceId) => setDeleteDevice(deviceId)}
              isUnassigning={provisionMutation.isPending}
            />
          )}
        </div>

        {/* Unassign Device Confirmation */}
        <ConfirmDialog
          isOpen={deleteDevice !== null}
          onClose={() => setDeleteDevice(null)}
          onConfirm={() => deleteDevice && handleUnassignDevice(deleteDevice)}
          title="Unassign Device"
          message="Are you sure you want to unassign this device from the plant?"
          confirmText="Unassign"
          isLoading={provisionMutation.isPending}
        />
      </div>
    </Layout>
  );
}
