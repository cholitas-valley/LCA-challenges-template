/**
 * Designer Page Tests
 *
 * Tests for the Designer page component including sidebar, canvas,
 * mode toggling, and drag-and-drop functionality.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { Designer } from '../Designer';
import { Plant } from '../../types/plant';

// Mock the hooks
vi.mock('../../hooks', () => ({
  usePlants: vi.fn(),
  useUpdatePlantPosition: vi.fn(),
}));

// Import mocked hooks
import { usePlants, useUpdatePlantPosition } from '../../hooks';

const mockUsePlants = usePlants as ReturnType<typeof vi.fn>;
const mockUseUpdatePlantPosition = useUpdatePlantPosition as ReturnType<typeof vi.fn>;

// Mock plants for testing
const mockPlacedPlants: Plant[] = [
  {
    id: 'plant-1',
    name: 'Monstera',
    species: 'Monstera Deliciosa',
    thresholds: null,
    position: { x: 100, y: 150 },
    created_at: '2024-01-01T00:00:00Z',
    device_count: 1,
    latest_telemetry: null,
  },
  {
    id: 'plant-2',
    name: 'Snake Plant',
    species: 'Sansevieria',
    thresholds: null,
    position: { x: 300, y: 200 },
    created_at: '2024-01-01T00:00:00Z',
    device_count: 0,
    latest_telemetry: null,
  },
];

const mockUnplacedPlants: Plant[] = [
  {
    id: 'plant-3',
    name: 'Pothos',
    species: 'Epipremnum aureum',
    thresholds: null,
    position: null,
    created_at: '2024-01-01T00:00:00Z',
    device_count: 0,
    latest_telemetry: null,
  },
];

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: React.ReactNode }) {
    return (
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>{children}</BrowserRouter>
      </QueryClientProvider>
    );
  };
}

describe('Designer', () => {
  const mockMutateAsync = vi.fn().mockResolvedValue({});

  beforeEach(() => {
    vi.clearAllMocks();
    mockUseUpdatePlantPosition.mockReturnValue({
      mutateAsync: mockMutateAsync,
    });
  });

  it('renders loading state', () => {
    mockUsePlants.mockReturnValue({
      data: null,
      isLoading: true,
      isError: false,
    });

    render(<Designer />, { wrapper: createWrapper() });

    // Loading spinner should be visible
    expect(screen.getByRole('status')).toBeInTheDocument();
  });

  it('renders empty state when no plants', () => {
    mockUsePlants.mockReturnValue({
      data: { plants: [] },
      isLoading: false,
      isError: false,
    });

    render(<Designer />, { wrapper: createWrapper() });

    expect(screen.getByText('No Plants Yet')).toBeInTheDocument();
    expect(screen.getByText('Create some plants to arrange them in your space.')).toBeInTheDocument();
  });

  it('renders canvas with placed plants', () => {
    mockUsePlants.mockReturnValue({
      data: { plants: mockPlacedPlants },
      isLoading: false,
      isError: false,
    });

    render(<Designer />, { wrapper: createWrapper() });

    // Canvas should be visible
    expect(screen.getByRole('img', { name: /designer canvas/i })).toBeInTheDocument();

    // Placed plants should appear
    expect(screen.getByText('Monstera')).toBeInTheDocument();
    expect(screen.getByText('Snake Plant')).toBeInTheDocument();
  });

  it('renders sidebar with unplaced plants', () => {
    mockUsePlants.mockReturnValue({
      data: { plants: [...mockPlacedPlants, ...mockUnplacedPlants] },
      isLoading: false,
      isError: false,
    });

    render(<Designer />, { wrapper: createWrapper() });

    // Sidebar should show unplaced plants
    expect(screen.getByText('Unplaced Plants')).toBeInTheDocument();
    expect(screen.getByText('Pothos')).toBeInTheDocument();
  });

  it('toggles between view and edit modes', () => {
    mockUsePlants.mockReturnValue({
      data: { plants: mockPlacedPlants },
      isLoading: false,
      isError: false,
    });

    render(<Designer />, { wrapper: createWrapper() });

    const viewButton = screen.getByRole('button', { name: /view/i });
    const editButton = screen.getByRole('button', { name: /edit/i });

    // Initially in view mode (View is primary)
    expect(viewButton).toHaveClass('bg-action-primary');
    expect(editButton).toHaveClass('bg-action-secondary');

    // Click edit button
    fireEvent.click(editButton);

    // Now in edit mode (Edit is primary)
    expect(editButton).toHaveClass('bg-action-primary');
    expect(viewButton).toHaveClass('bg-action-secondary');
  });

  it('shows hint when no plants are placed but unplaced exist', () => {
    mockUsePlants.mockReturnValue({
      data: { plants: mockUnplacedPlants },
      isLoading: false,
      isError: false,
    });

    render(<Designer />, { wrapper: createWrapper() });

    expect(screen.getByText(/switch to edit mode/i)).toBeInTheDocument();
  });

  it('navigates to plant detail on click', () => {
    mockUsePlants.mockReturnValue({
      data: { plants: mockPlacedPlants },
      isLoading: false,
      isError: false,
    });

    render(<Designer />, { wrapper: createWrapper() });

    const monsteraButton = screen.getByRole('button', { name: /monstera/i });
    fireEvent.click(monsteraButton);

    // Navigation should occur (check window location in integration test)
    expect(window.location.pathname).toBe('/plants/plant-1');
  });

  it('renders error state', () => {
    mockUsePlants.mockReturnValue({
      data: null,
      isLoading: false,
      isError: true,
    });

    render(<Designer />, { wrapper: createWrapper() });

    expect(screen.getByText('Error Loading Plants')).toBeInTheDocument();
  });
});
