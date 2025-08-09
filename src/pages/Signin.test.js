import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignIn from './Signin';
import { ThemeProvider } from '../context/ThemeContext';

const mockNavigate = jest.fn();
jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => mockNavigate,
  }),
  { virtual: true }
);

let mockLogin;
jest.mock(
  '../context/AuthContext',
  () => ({
    useAuth: () => ({ login: mockLogin }),
  }),
  { virtual: true }
);

function renderSignIn() {
  return render(
    <ThemeProvider>
      <SignIn />
    </ThemeProvider>
  );
}

beforeEach(() => {
  mockLogin = jest.fn();
  jest.clearAllMocks();
});

test('password field toggles visibility', async () => {
  renderSignIn();

  const passwordField = screen.getByLabelText(/^Password$/i);
  const toggleButton = screen.getByLabelText(/toggle password visibility/i);

  expect(passwordField).toHaveAttribute('type', 'password');
  await userEvent.click(toggleButton);
  expect(passwordField).toHaveAttribute('type', 'text');
  await userEvent.click(toggleButton);
  expect(passwordField).toHaveAttribute('type', 'password');
});

test('landlord sign in navigates to landlord dashboard', async () => {
  mockLogin.mockResolvedValue({ role: 'landlord' });
  renderSignIn();

  await userEvent.type(screen.getByLabelText(/email address/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/^Password$/i), 'secret');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/landlord-dashboard'));
  expect(mockLogin).toHaveBeenCalledWith('a@b.com', 'secret');
});

test('tenant sign in navigates to tenant dashboard', async () => {
  mockLogin.mockResolvedValue({ role: 'tenant' });
  renderSignIn();

  await userEvent.type(screen.getByLabelText(/email address/i), 't@c.com');
  await userEvent.type(screen.getByLabelText(/^Password$/i), 'secret');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/tenant-dashboard'));
  expect(mockLogin).toHaveBeenCalledWith('t@c.com', 'secret');
});


