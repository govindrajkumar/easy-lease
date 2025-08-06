import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import ThemeToggle from './ThemeToggle';
import { ThemeProvider } from '../context/ThemeContext';

beforeEach(() => {
  localStorage.clear();
  document.documentElement.className = '';
});

test('toggles dark mode on click', async () => {
  render(
    <ThemeProvider>
      <ThemeToggle />
    </ThemeProvider>
  );

  const toggle = screen.getByRole('button', { name: /toggle theme/i });
  const root = document.documentElement;

  expect(root).not.toHaveClass('dark');
  await userEvent.click(toggle);
  expect(root).toHaveClass('dark');
  expect(localStorage.getItem('darkMode')).toBe('true');

  await userEvent.click(toggle);
  expect(root).not.toHaveClass('dark');
  expect(localStorage.getItem('darkMode')).toBe('false');
});

