import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import SignIn from './Signin';
import { ThemeProvider } from '../context/ThemeContext';

jest.mock(
  'react-router-dom',
  () => ({
    useNavigate: () => jest.fn(),
  }),
  { virtual: true }
);

jest.mock('../firebase', () => ({ auth: {}, db: {} }), { virtual: true });

function renderSignIn() {
  return render(
    <ThemeProvider>
      <SignIn />
    </ThemeProvider>
  );
}

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

