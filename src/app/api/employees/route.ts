import { NextRequest, NextResponse } from 'next/server';
import { protectedApiHandler, apiSuccess, apiError, validateRequired } from '@/lib/api-helpers';

export async function GET(request: NextRequest) {
  return protectedApiHandler(request, async (context) => {
    const { tenantId, query } = context;
    
    const limit = parseInt(((query?.limit) as string) || '10');
    const offset = parseInt(((query?.offset) as string) || '0');
    const department = (query?.department) as string;

    // Mock employees data - will be replaced with real DB query in Phase 2A
    const mockEmployees = [
      {
        id: 'emp-001',
        tenant_id: tenantId,
        name: 'Rajesh Kumar',
        email: 'rajesh@arcus.local',
        phone: '+91-9876543210',
        department: 'Operations',
        role: 'Senior Manager',
        status: 'active',
        joining_date: '2024-01-15',
        salary: 850000,
      },
      {
        id: 'emp-002',
        tenant_id: tenantId,
        name: 'Priya Singh',
        email: 'priya@arcus.local',
        phone: '+91-9123456789',
        department: 'Sales',
        role: 'Sales Executive',
        status: 'active',
        joining_date: '2024-03-20',
        salary: 450000,
      },
      {
        id: 'emp-003',
        tenant_id: tenantId,
        name: 'Amit Patel',
        email: 'amit@arcus.local',
        phone: '+91-8765432109',
        department: 'Operations',
        role: 'Warehouse Manager',
        status: 'active',
        joining_date: '2023-11-10',
        salary: 650000,
      },
      {
        id: 'emp-004',
        tenant_id: tenantId,
        name: 'Neha Gupta',
        email: 'neha@arcus.local',
        phone: '+91-7654321098',
        department: 'Finance',
        role: 'Accountant',
        status: 'active',
        joining_date: '2024-02-01',
        salary: 500000,
      },
    ];

    // Filter by department if provided
    let filtered = mockEmployees;
    if (department) {
      filtered = filtered.filter((e) => e.department.toLowerCase() === department.toLowerCase());
    }

    // Apply pagination
    const paginated = filtered.slice(offset, offset + limit);

    return {
      data: {
        employees: paginated,
        pagination: {
          limit,
          offset,
          total: filtered.length,
          department: department || 'all',
        },
      },
    };
  });
}

export async function POST(request: NextRequest) {
  return protectedApiHandler(request, async (context) => {
    const { tenantId, body } = context;

    // Validate required fields
    const required = ['name', 'email', 'department', 'role', 'salary'];
    const missing = validateRequired(body, required);
    if (missing && missing.length > 0) {
      return {
        error: `Missing required fields: ${missing.join(', ')}`,
      };
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(body.email)) {
      return {
        error: 'Invalid email format',
      };
    }

    // Validate salary is a positive number
    if (body.salary <= 0) {
      return {
        error: 'Salary must be greater than 0',
      };
    }

    // Create new employee (mock)
    const newEmployee = {
      id: `emp-${Date.now()}`,
      tenant_id: tenantId,
      name: body.name,
      email: body.email,
      phone: body.phone || null,
      department: body.department,
      role: body.role,
      status: body.status || 'active',
      joining_date: body.joining_date || new Date().toISOString().split('T')[0],
      salary: body.salary,
      created_at: new Date().toISOString(),
    };

    // In Phase 2A: Save to database
    // const repository = context.dataSource.getRepository(Employee);
    // const saved = await repository.save(newEmployee);

    return {
      data: newEmployee,
    };
  });
}
