import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';

// Mock data: roles with permissions
const mockRoles = [
  {
    id: 1,
    name: 'Admin',
    permissions: ['manage_users', 'manage_content', 'manage_roles', 'view_reports', 'manage_settings'],
  },
  {
    id: 2,
    name: 'Manager',
    permissions: ['manage_users', 'manage_content', 'view_reports'],
  },
  {
    id: 3,
    name: 'Accountant',
    permissions: ['view_reports'],
  },
];

const availablePermissions = [
  { id: 'manage_users', label: 'Manage Users' },
  { id: 'manage_content', label: 'Manage Content' },
  { id: 'manage_roles', label: 'Manage Roles' },
  { id: 'view_reports', label: 'View Reports' },
  { id: 'manage_settings', label: 'Manage Settings' },
];

const schema = yup.object({
  name: yup.string().required('Role name is required').min(2, 'At least 2 characters'),
  permissions: yup.array().min(1, 'Select at least one permission'),
});

const Roles = () => {
  const [roles, setRoles] = useState(mockRoles);
  const [showModal, setShowModal] = useState(false);
  const [editingRole, setEditingRole] = useState(null);

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    watch,
    formState: { errors },
  } = useForm({
    resolver: yupResolver(schema),
    defaultValues: {
      name: '',
      permissions: [],
    },
  });

  const selectedPermissions = watch('permissions') || [];

  const openCreateModal = () => {
    setEditingRole(null);
    reset({ name: '', permissions: [] });
    setShowModal(true);
  };

  const openEditModal = (role) => {
    setEditingRole(role);
    reset({ name: role.name, permissions: role.permissions });
    setShowModal(true);
  };

  const onSubmit = (data) => {
    if (editingRole) {
      setRoles(roles.map((r) => (r.id === editingRole.id ? { ...r, name: data.name, permissions: data.permissions } : r)));
    } else {
      const newId = Math.max(0, ...roles.map((r) => r.id)) + 1;
      setRoles([...roles, { id: newId, name: data.name, permissions: data.permissions }]);
    }
    setShowModal(false);
  };

  const deleteRole = (id) => {
    if (window.confirm('Delete this role? This action cannot be undone.')) {
      setRoles(roles.filter((r) => r.id !== id));
    }
  };

  const togglePermission = (permissionId) => {
    const current = selectedPermissions;
    if (current.includes(permissionId)) {
      setValue('permissions', current.filter((p) => p !== permissionId), { shouldValidate: true });
    } else {
      setValue('permissions', [...current, permissionId], { shouldValidate: true });
    }
  };

  return (
    <div>
      <div className="d-flex justify-content-between align-items-center mb-3">
        <div>
          <h2>Roles & Permissions</h2>
          <p className="text-muted">Manage user roles and their access permissions</p>
        </div>
        <button className="btn btn-primary" onClick={openCreateModal}>
          Create Role
        </button>
      </div>

      {/* Card wrapper for the table */}
      <div className="card">
        <div className="card-body p-0">
          <div className="table-responsive">
            <table className="table table-striped table-hover mb-0">
              <thead>
                <tr>
                  <th>Role</th>
                  <th>Permissions</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {roles.map((role) => (
                  <tr key={role.id}>
                    <td className="fw-bold">{role.name}</td>
                    <td>
                      {role.permissions.map((perm) => (
                        <span key={perm} className="badge bg-secondary me-1 mb-1">
                          {availablePermissions.find((p) => p.id === perm)?.label || perm}
                        </span>
                      ))}
                    </td>
                    <td>
                      <button
                        className="btn btn-sm btn-outline-primary me-2"
                        onClick={() => openEditModal(role)}
                      >
                        Edit
                      </button>
                      <button
                        className="btn btn-sm btn-outline-danger"
                        onClick={() => deleteRole(role.id)}
                      >
                        Delete
                      </button>
                    </td>
                  </tr>
                ))}
                {roles.length === 0 && (
                  <tr>
                    <td colSpan="3" className="text-center">No roles defined. Create one.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal for Create/Edit Role */}
      {showModal && (
        <div
          className="modal show d-block"
          tabIndex="-1"
          style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
        >
          <div className="modal-dialog">
            <div className="modal-content">
              <div className="modal-header">
                <h5 className="modal-title">{editingRole ? 'Edit Role' : 'Create Role'}</h5>
                <button
                  type="button"
                  className="btn-close"
                  onClick={() => setShowModal(false)}
                ></button>
              </div>
              <form onSubmit={handleSubmit(onSubmit)}>
                <div className="modal-body">
                  <div className="mb-3">
                    <label htmlFor="name" className="form-label">Role Name</label>
                    <input
                      type="text"
                      className={`form-control ${errors.name ? 'is-invalid' : ''}`}
                      id="name"
                      {...register('name')}
                    />
                    {errors.name && <div className="invalid-feedback">{errors.name.message}</div>}
                  </div>
                  <div className="mb-3">
                    <label className="form-label">Permissions</label>
                    <div className="border rounded p-3">
                      {availablePermissions.map((perm) => (
                        <div className="form-check" key={perm.id}>
                          <input
                            type="checkbox"
                            className="form-check-input"
                            id={`perm-${perm.id}`}
                            checked={selectedPermissions.includes(perm.id)}
                            onChange={() => togglePermission(perm.id)}
                          />
                          <label className="form-check-label" htmlFor={`perm-${perm.id}`}>
                            {perm.label}
                          </label>
                        </div>
                      ))}
                    </div>
                    {errors.permissions && (
                      <div className="text-danger mt-1">{errors.permissions.message}</div>
                    )}
                  </div>
                </div>
                <div className="modal-footer">
                  <button
                    type="button"
                    className="btn btn-secondary"
                    onClick={() => setShowModal(false)}
                  >
                    Cancel
                  </button>
                  <button type="submit" className="btn btn-primary">
                    {editingRole ? 'Update' : 'Create'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Roles;