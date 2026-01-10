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
import { Button, StatusBadge } from '../components/ui';
import type { StatusType } from '../components/ui';
import {
  usePlant,
  usePlantHistory,
  usePlantDevices,
  useUpdatePlant,
  useDeletePlant,
  usePlantHealthCheck
} from '../hooks';
import { useProvisionDevice } from '../hooks/useDevices';
import type { PlantThresholds } from '../types';

function mapHealthStatus(health: string): StatusType {
  switch (health) {
    case 'optimal': return 'online';
    case 'warning': return 'warning';
    case 'critical': return 'error';
    default: return 'info';
  }
}

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
  const { data: healthCheck, isLoading: healthLoading } = usePlantHealthCheck(id!);

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

  return (
    <Layout>
      <div className="max-w-7xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-6">
          <Link to="/" className="text-action-primary hover:text-action-primary-hover text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-primary rounded">
            Dashboard
          </Link>
          <span className="text-gray-500 mx-2">/</span>
          <Link to="/plants" className="text-action-primary hover:text-action-primary-hover text-sm font-medium focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-primary rounded">
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
                    className="text-3xl font-bold text-gray-900 border-b-2 border-action-primary focus:outline-none focus:ring-2 focus:ring-action-primary rounded"
                    autoFocus
                  />
                  <Button variant="primary" size="sm" onClick={handleNameSave}>
                    Save
                  </Button>
                  <Button variant="secondary" size="sm" onClick={handleNameCancel}>
                    Cancel
                  </Button>
                </div>
              ) : (
                <div className="flex items-center gap-3">
                  <h1 className="text-3xl font-bold text-gray-900">{plant.name}</h1>
                  <button
                    onClick={handleNameEdit}
                    className="text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-primary rounded"
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
                className="inline-flex items-center justify-center px-4 py-2 text-sm font-medium rounded-md bg-action-primary text-action-primary-text hover:bg-action-primary-hover transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-action-primary"
              >
                View Care Plan
              </Link>
              <Button
                variant="danger"
                onClick={handleDeletePlant}
                loading={deleteMutation.isPending}
              >
                Delete Plant
              </Button>
            </div>
          </div>
        </div>

        {/* Health Check Section */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Plant Health Status</h2>

          {healthLoading ? (
            <div className="flex items-center justify-center py-8">
              <LoadingSpinner />
            </div>
          ) : healthCheck ? (
            <div>
              {/* Status Badge */}
              <div className="flex items-center gap-3 mb-4">
                <StatusBadge
                  status={mapHealthStatus(healthCheck.status)}
                  label={healthCheck.status.toUpperCase()}
                />
              </div>

              {/* 24-Hour Trends */}
              {healthCheck.trends && healthCheck.trends.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-700 mb-2">24-Hour Trends:</h3>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                    {healthCheck.trends.map((trend) => (
                      <div key={trend.metric} className="flex items-center gap-2 p-2 bg-gray-50 rounded text-sm">
                        <span className={`w-2 h-2 rounded-full ${
                          trend.direction === 'rising' ? 'bg-blue-500' :
                          trend.direction === 'falling' ? 'bg-orange-500' :
                          'bg-green-500'
                        }`} />
                        <span>{trend.summary}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Issues */}
              {healthCheck.issues.length > 0 && (
                <div className="mb-4">
                  <h3 className="font-medium text-gray-700 mb-2">Issues:</h3>
                  <ul className="space-y-2">
                    {healthCheck.issues.map((issue, idx) => (
                      <li key={idx} className={`flex items-start gap-2 p-2 rounded ${
                        issue.severity === 'critical' ? 'bg-red-50' : 'bg-yellow-50'
                      }`}>
                        <span className={`mt-0.5 w-2 h-2 rounded-full ${
                          issue.severity === 'critical' ? 'bg-red-500' : 'bg-yellow-500'
                        }`} />
                        <span className="text-sm">{issue.message}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Recommendations */}
              {healthCheck.recommendations.length > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Recommendations:</h3>
                  <ul className="space-y-2">
                    {healthCheck.recommendations.map((rec, idx) => (
                      <li key={idx} className={`flex items-start gap-2 p-2 rounded ${
                        rec.priority === 'high' ? 'bg-red-50' :
                        rec.priority === 'medium' ? 'bg-orange-50' :
                        'bg-gray-50'
                      }`}>
                        <span className="text-sm">{rec.action}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}

              {healthCheck.issues.length === 0 && healthCheck.recommendations.length === 0 && healthCheck.trends.length === 0 && (
                <p className="text-gray-500">No data available yet.</p>
              )}
            </div>
          ) : (
            <p className="text-gray-500 text-center py-4">
              Unable to check plant health
            </p>
          )}
        </div>

        {/* Current Readings */}
        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-4">Current Readings</h2>
          {latestTelemetry ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-4xl font-bold mb-2 text-gray-900">
                  {latestTelemetry.soil_moisture !== null ? `${latestTelemetry.soil_moisture}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 font-medium">Soil Moisture</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2 text-gray-900">
                  {latestTelemetry.temperature !== null ? `${latestTelemetry.temperature}°C` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 font-medium">Temperature</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2 text-gray-900">
                  {latestTelemetry.humidity !== null ? `${latestTelemetry.humidity}%` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 font-medium">Humidity</div>
              </div>
              <div className="text-center">
                <div className="text-4xl font-bold mb-2 text-gray-900">
                  {latestTelemetry.light_level !== null ? `${latestTelemetry.light_level} lux` : 'N/A'}
                </div>
                <div className="text-sm text-gray-600 font-medium">Light Level</div>
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
