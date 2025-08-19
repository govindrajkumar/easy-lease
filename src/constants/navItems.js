export function landlordNavItems({ active, pendingTenants = 0, newRequests = 0, unreadMessages = 0 } = {}) {
  return [
    { icon: '🏠', label: 'Dashboard', href: '/landlord-dashboard', active: active === 'dashboard' },
    { icon: '🏢', label: 'Properties', href: '/properties', active: active === 'properties' },
    { icon: '👥', label: 'Tenants', href: '/tenants', active: active === 'tenants', badge: pendingTenants },
    { icon: '💬', label: 'Chat', href: '/chat', active: active === 'chat' },
    { icon: '🔔', label: 'Announcements', href: '/announcements', active: active === 'announcements', badge: unreadMessages },
    { icon: '💳', label: 'Payments', href: '/payments', active: active === 'payments' },
    { icon: '🛠️', label: 'Maintenance', href: '/maintenance', active: active === 'maintenance', badge: newRequests },
    { icon: '📊', label: 'Analytics', href: '/analytics', active: active === 'analytics' },
    { icon: '⚙️', label: 'Settings', href: '/settings', active: active === 'settings' },
  ];
}

export function tenantNavItems({ active, unread = 0, unreadMessages = 0 } = {}) {
  return [
    { icon: '📄', label: 'Lease Info', href: '/tenant-dashboard', active: active === 'dashboard' },
    { icon: '💳', label: 'Payments', href: '/tenant-payments', active: active === 'payments' },
    { icon: '🛠️', label: 'Maintenance', href: '/tenant-maintenance', active: active === 'maintenance', badge: unread },
    { icon: '💬', label: 'Chat', href: '/tenant-chat', active: active === 'chat' },
    { icon: '🔔', label: 'Announcements', href: '/tenant-announcements', active: active === 'announcements', badge: unreadMessages },
    { icon: '👤', label: 'Profile & Settings', href: '/tenant-settings', active: active === 'settings' },
  ];
}
