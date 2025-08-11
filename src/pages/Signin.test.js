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

// Mock Firebase utilities
jest.mock('../firebase', () => ({ auth: {}, db: {} }), { virtual: true });
import { signInWithEmailAndPassword } from 'firebase/auth';
import { getDoc } from 'firebase/firestore';
jest.mock('firebase/auth', () => ({ signInWithEmailAndPassword: jest.fn() }));
jest.mock('firebase/firestore', () => ({ doc: jest.fn(), getDoc: jest.fn() }));

function renderSignIn() {
  return render(
    <ThemeProvider>
      <SignIn />
    </ThemeProvider>
  );
}

beforeEach(() => {
  jest.clearAllMocks();
  sessionStorage.clear();
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
  signInWithEmailAndPassword.mockResolvedValue({ user: { uid: '1' } });
  getDoc.mockResolvedValue({
    exists: () => true,
    data: () => ({ role: 'landlord', first_name: 'Larry' }),
  });

  renderSignIn();

  await userEvent.type(screen.getByLabelText(/email address/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/^Password$/i), 'secret');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/landlord-dashboard'));
  expect(signInWithEmailAndPassword).toHaveBeenCalledWith({}, 'a@b.com', 'secret');
  expect(sessionStorage.getItem('user_email')).toBe('a@b.com');
  expect(sessionStorage.getItem('user_first_name')).toBe('Larry');
});

test('tenant sign in navigates to tenant dashboard', async () => {
  signInWithEmailAndPassword.mockResolvedValue({ user: { uid: '2' } });
  getDoc.mockResolvedValue({
    exists: () => true,
    data: () => ({ role: 'tenant', first_name: 'Tina' }),
  });

  renderSignIn();

  await userEvent.type(screen.getByLabelText(/email address/i), 't@c.com');
  await userEvent.type(screen.getByLabelText(/^Password$/i), 'secret');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  await waitFor(() => expect(mockNavigate).toHaveBeenCalledWith('/tenant-dashboard'));
  expect(sessionStorage.getItem('user_email')).toBe('t@c.com');
  expect(sessionStorage.getItem('user_first_name')).toBe('Tina');
});

test('shows error for invalid email format', async () => {
  renderSignIn();

  await userEvent.type(screen.getByLabelText(/email address/i), 'invalid');
  await userEvent.type(screen.getByLabelText(/^Password$/i), 'secret');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByText(/invalid email address/i)).toBeInTheDocument();
  expect(signInWithEmailAndPassword).not.toHaveBeenCalled();
});

test('shows error when password is incorrect', async () => {
  signInWithEmailAndPassword.mockRejectedValue({ code: 'auth/wrong-password' });

  renderSignIn();

  await userEvent.type(screen.getByLabelText(/email address/i), 'a@b.com');
  await userEvent.type(screen.getByLabelText(/^Password$/i), 'wrong');
  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  expect(await screen.findByText(/incorrect password/i)).toBeInTheDocument();
});


