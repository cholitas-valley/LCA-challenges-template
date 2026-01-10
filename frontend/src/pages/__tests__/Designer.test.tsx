/**
 * Designer Page Tests
 *
 * Tests for the Designer page component using ScandinavianCanvas,
 * including sidebar, mode toggling, and spot assignment.
 */

import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
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

// Mock plants with positions that map to spots (100,150 -> spot 1 area)
const mockAssignedPlants: Plant[] = [
  {
    id: 'plant-1',
    name: 'Monstera',
    species: 'Monstera Deliciosa',
    thresholds: null,
    position: { x: 120, y: 108 }, // Maps near spot 1 (15%, 18%)
    created_at: '2024-01-01T00:00:00Z',
    device_count: 1,
    latest_telemetry: null,
  },
  {
    id: 'plant-2',
    name: 'Snake Plant',
    species: 'Sansevieria',
    thresholds: null,
    position: { x: 200, y: 108 }, // Maps near spot 2 (25%, 18%)
    created_at: '2024-01-01T00:00:00Z',
    device_count: 0,
    latest_telemetry: null,
  },
];

const mockUnassignedPlants: Plant[] = [
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
    expect(screen.getByText('Create some plants to arrange them in your room.')).toBeInTheDocument();
  });

  it('renders ScandinavianCanvas with room background', () => {
    mockUsePlants.mockReturnValue({
      data: { plants: mockAssignedPlants },
      isLoading: false,
      isError: false,
    });

    render(<Designer />, { wrapper: createWrapper() });

    // Scandinavian room background should be visible
    expect(screen.getByAltText('Scandinavian living room')).toBeInTheDocument();
  });

  it('renders sidebar with unassigned plants', () => {
    mockUsePlants.mockReturnValue({
      data: { plants: [...mockAssignedPlants, ...mockUnassignedPlants] },
      isLoading: false,
      isError: false,
    });

    render(<Designer />, { wrapper: createWrapper() });

    // Sidebar should show unassigned plants
    expect(screen.getByText('Unassigned Plants')).toBeInTheDocument();
    expect(screen.getByText('Pothos')).toBeInTheDocument();
  });

  it('toggles between view and edit modes', () => {
    mockUsePlants.mockReturnValue({
      data: { plants: mockAssignedPlants },
      isLoading: false,
      isError: false,
    });

    render(<Designer />, { wrapper: createWrapper() });

    const viewButton = screen.getByRole('button', { name: /view/i });
    const editButton = screen.getByRole('button', { name: /edit/i });

    // Initially in view mode (View button has white background)
    expect(viewButton).toHaveClass('bg-white');

    // Click edit button
    fireEvent.click(editButton);

    // Now in edit mode (Edit button has amber background)
    expect(editButton).toHaveClass('bg-amber-500');
  });

  it('renders Room Designer title', () => {
    mockUsePlants.mockReturnValue({
      data: { plants: mockAssignedPlants },
      isLoading: false,
      isError: false,
    });

    render(<Designer />, { wrapper: createWrapper() });

    expect(screen.getByText('Room Designer')).toBeInTheDocument();
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

  it('shows all plants placed message when sidebar is empty', () => {
    mockUsePlants.mockReturnValue({
      data: { plants: mockAssignedPlants },
      isLoading: false,
      isError: false,
    });

    // In edit mode, sidebar should show "All plants are placed"
    render(<Designer />, { wrapper: createWrapper() });

    // Click edit to show sidebar
    const editButton = screen.getByRole('button', { name: /edit/i });
    fireEvent.click(editButton);

    expect(screen.getByText('All plants are placed!')).toBeInTheDocument();
  });
});
