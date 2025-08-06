import { render, screen } from '@testing-library/react';
import PrivateRoute from './PrivateRoute';

let mockCurrentUser;
jest.mock('../context/AuthContext', () => ({
  useAuth: () => ({ currentUser: mockCurrentUser }),
}));

jest.mock(
  'react-router-dom',
  () => ({
    Navigate: ({ to }) => <div>Navigate {to}</div>,
    Outlet: () => <div>Outlet</div>,
  }),
  { virtual: true }
);

describe('PrivateRoute', () => {
  beforeEach(() => {
    mockCurrentUser = null;
  });

  test('renders outlet when user is authenticated', () => {
    mockCurrentUser = { uid: 'abc' };
    render(<PrivateRoute />);
    expect(screen.getByText('Outlet')).toBeInTheDocument();
  });

  test('redirects to signin when user is not authenticated', () => {
    mockCurrentUser = null;
    render(<PrivateRoute />);
    expect(screen.getByText('Navigate /signin')).toBeInTheDocument();
  });
});

