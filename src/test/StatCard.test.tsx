import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import StatCard from '../components/dashboard/StatCard';
import { Dumbbell } from 'lucide-react';

describe('StatCard Component', () => {
  it('renders correctly with required props', () => {
    render(<StatCard title="Total Workouts" value="47" icon={Dumbbell} index={0} />);

    expect(screen.getByText('Total Workouts')).toBeInTheDocument();
    expect(screen.getByText('47')).toBeInTheDocument();
  });

  it('shows trend info when provided', () => {
    render(<StatCard title="Total Workouts" value="47" icon={Dumbbell} index={0} trend={{ value: 12, label: 'vs last month' }} />);

    // The text might be split across multiple nodes
    expect(screen.getByText(/12%/)).toBeInTheDocument();
    expect(screen.getByText('vs last month')).toBeInTheDocument();
  });

  it('applies accent styles when specified', () => {
    render(<StatCard title="Total Workouts" value="47" icon={Dumbbell} index={0} accent />);

    const card = screen.getByTestId('stat-card');
    // We check for some classes that should be present when accent is true
    expect(card).toHaveClass('border-primary/40');
  });
});
