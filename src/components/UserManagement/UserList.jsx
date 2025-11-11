import React, { useState, useEffect } from 'react'
import { apiService } from '../../services/api'
import { useAuth } from '../../contexts/AuthContext'
import './UserList.css'

function UserList({ organizationId }) {
  const { user: currentUser, hasRole, hasPermission } = useAuth()
  const [users, setUsers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [filterRole, setFilterRole] = useState('all')
  const [showAddUser, setShowAddUser] = useState(false)

  useEffect(() => {
    if (organizationId || currentUser?.organization_id) {
      fetchUsers()
    }
  }, [organizationId, currentUser?.organization_id])

  const fetchUsers = async () => {
    try {
      setLoading(true)
      const orgId = organizationId || currentUser?.organization_id
      const response = await apiService.getUsers({ organization_id: orgId })
      setUsers(Array.isArray(response) ? response : response?.users || [])
    } catch (error) {
      console.error('Failed to fetch users:', error)
      setUsers([])
    } finally {
      setLoading(false)
    }
  }

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('Are you sure you want to remove this user?')) return

    try {
      await apiService.deleteUser(userId)
      fetchUsers()
    } catch (error) {
      console.error('Failed to delete user:', error)
      alert('Failed to delete user')
    }
  }

  const handleRoleChange = async (userId, newRole) => {
    try {
      await apiService.updateUser(userId, { role: newRole })
      fetchUsers()
    } catch (error) {
      console.error('Failed to update role:', error)
      alert('Failed to update user role')
    }
  }

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesRole = filterRole === 'all' || user.role === filterRole
    return matchesSearch && matchesRole
  })

  const canManageUsers = hasPermission('manage_users')

  if (!canManageUsers) {
    return (
      <div className="user-list-container">
        <div className="access-denied">
          <span className="access-denied-icon">🔒</span>
          <h3>Access Denied</h3>
          <p>You don't have permission to manage users.</p>
        </div>
      </div>
    )
  }

  return (
    <div className="user-list-container">
      <div className="user-list-header">
        <div className="header-left">
          <h2 className="section-title">👥 User Management</h2>
          <p className="section-subtitle">Manage organization members and their roles</p>
        </div>
        <div className="header-right">
          <button 
            className="btn-primary"
            onClick={() => setShowAddUser(true)}
          >
            + Add User
          </button>
        </div>
      </div>

      <div className="user-list-filters">
        <div className="search-box">
          <span className="search-icon">🔍</span>
          <input
            type="text"
            placeholder="Search users by name or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
        </div>
        <select
          value={filterRole}
          onChange={(e) => setFilterRole(e.target.value)}
          className="role-filter"
        >
          <option value="all">All Roles</option>
          <option value="Org Admin">Org Admin</option>
          <option value="Project Manager">Project Manager</option>
          <option value="Team Member">Team Member</option>
          <option value="Viewer">Viewer</option>
        </select>
      </div>

      {loading ? (
        <div className="loading-state">Loading users...</div>
      ) : filteredUsers.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">👤</span>
          <p>No users found</p>
        </div>
      ) : (
        <div className="user-list-table">
          <table>
            <thead>
              <tr>
                <th>User</th>
                <th>Email</th>
                <th>Role</th>
                <th>Status</th>
                <th>Last Active</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredUsers.map((user) => (
                <tr key={user.id || user._id}>
                  <td>
                    <div className="user-info">
                      <div className="user-avatar">
                        {user.name?.charAt(0).toUpperCase() || 'U'}
                      </div>
                      <div className="user-details">
                        <div className="user-name">{user.name || 'Unknown'}</div>
                        {user.title && <div className="user-title">{user.title}</div>}
                      </div>
                    </div>
                  </td>
                  <td>{user.email}</td>
                  <td>
                    {user.id === currentUser?.id || user._id === currentUser?._id ? (
                      <span className="role-badge current-user">{user.role}</span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => handleRoleChange(user.id || user._id, e.target.value)}
                        className="role-select"
                        disabled={user.role === 'Super Admin' && !hasRole('Super Admin')}
                      >
                        <option value="Org Admin">Org Admin</option>
                        <option value="Project Manager">Project Manager</option>
                        <option value="Team Member">Team Member</option>
                        <option value="Viewer">Viewer</option>
                      </select>
                    )}
                  </td>
                  <td>
                    <span className={`status-badge ${user.status || 'active'}`}>
                      {user.status || 'Active'}
                    </span>
                  </td>
                  <td>{user.lastActive ? new Date(user.lastActive).toLocaleDateString() : 'Never'}</td>
                  <td>
                    <div className="action-buttons">
                      {user.id !== currentUser?.id && user._id !== currentUser?._id && (
                        <button
                          className="btn-danger btn-sm"
                          onClick={() => handleDeleteUser(user.id || user._id)}
                          title="Remove user"
                        >
                          🗑️
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showAddUser && (
        <AddUserModal
          organizationId={organizationId || currentUser?.organizationId}
          onClose={() => setShowAddUser(false)}
          onSuccess={() => {
            setShowAddUser(false)
            fetchUsers()
          }}
        />
      )}
    </div>
  )
}

// Add User Modal Component
function AddUserModal({ organizationId, onClose, onSuccess }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    role: 'Team Member',
    title: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError(null)
    setLoading(true)

    try {
      await apiService.createUser({
        ...formData,
        organizationId,
      })
      onSuccess()
    } catch (error) {
      setError(error.response?.data?.detail || error.message || 'Failed to create user')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h3>Add New User</h3>
          <button className="modal-close" onClick={onClose}>×</button>
        </div>
        <form onSubmit={handleSubmit} className="add-user-form">
          <div className="form-group">
            <label>Full Name *</label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Email *</label>
            <input
              type="email"
              value={formData.email}
              onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              required
            />
          </div>
          <div className="form-group">
            <label>Role *</label>
            <select
              value={formData.role}
              onChange={(e) => setFormData({ ...formData, role: e.target.value })}
              required
            >
              <option value="Team Member">Team Member</option>
              <option value="Project Manager">Project Manager</option>
              <option value="Org Admin">Org Admin</option>
              <option value="Viewer">Viewer</option>
            </select>
          </div>
          <div className="form-group">
            <label>Job Title</label>
            <input
              type="text"
              value={formData.title}
              onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              placeholder="e.g., Software Engineer, Product Manager"
            />
          </div>
          {error && <div className="error-message">{error}</div>}
          <div className="form-actions">
            <button type="button" onClick={onClose} className="btn-secondary">
              Cancel
            </button>
            <button type="submit" className="btn-primary" disabled={loading}>
              {loading ? 'Creating...' : 'Create User'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UserList

