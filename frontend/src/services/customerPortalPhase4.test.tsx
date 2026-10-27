import { describe, it, expect, vi } from 'vitest';
import React from 'react';
import { renderToString } from 'react-dom/server';
import { CustomerTrackingTab } from '../components/dashboard/tabs/CustomerTrackingTab';
import { TabLoadingSkeleton } from '../components/dashboard/TabLoadingSkeleton';

describe('Phase 4: Customer Portal Code-Splitting & Real Order Telemetry Tracking', () => {
  const mockOrders = [
    {
      id: 'ord-luxury-101',
      order_number: 'YZ-ORD-2024-001',
      status: 'shipped',
      carrier: 'Sequel Secure Logistics',
      tracking_number: 'SEQUEL-990812-IN',
      total_amount: 145000,
      created_at: '2024-10-20T10:00:00.000Z',
      items: [{ product_name: 'Navaratna Royal Haram 22K' }],
      shipping_address: {
        fullName: 'Meenakshi Sundaram',
        street: '15 Boat Club Road, RA Puram',
        city: 'Chennai',
        zipCode: '600028',
        phone: '9840199887'
      }
    },
    {
      id: 'ord-luxury-102',
      order_number: 'YZ-ORD-2024-002',
      status: 'delivered',
      carrier: 'BlueDart Apex Armoured',
      tracking_number: 'BLUEDART-554433-IN',
      total_amount: 88000,
      created_at: '2024-10-15T12:00:00.000Z',
      items: [{ product_name: 'Solitaire Diamond Studs' }],
      shipping_address: {
        fullName: 'Meenakshi Sundaram',
        street: '15 Boat Club Road, RA Puram',
        city: 'Chennai',
        zipCode: '600028',
        phone: '9840199887'
      }
    }
  ];

  it('1. TabLoadingSkeleton renders with accessible status and animated placeholders', () => {
    const html = renderToString(<TabLoadingSkeleton />);
    expect(html).toContain('role="status"');
    expect(html).toContain('aria-label="Loading patron section"');
    expect(html).toContain('animate-pulse');
  });

  it('2. CustomerTrackingTab displays active carrier name and AWB number', () => {
    const html = renderToString(
      <CustomerTrackingTab
        orders={mockOrders}
        onSelectTab={vi.fn()}
      />
    );

    expect(html).toContain('Sequel Secure Logistics');
    expect(html).toContain('SEQUEL-990812-IN');
    expect(html).toContain('YZ-ORD-2024-001');
  });

  it('3. Renders 5-stage progression timeline and marks transit milestones', () => {
    const html = renderToString(
      <CustomerTrackingTab
        orders={mockOrders}
        onSelectTab={vi.fn()}
      />
    );

    expect(html).toContain('Order Logged &amp; Authenticated');
    expect(html).toContain('Insurance &amp; Vault Custody');
    expect(html).toContain('BIS 916 Hallmarking Inspected');
    expect(html).toContain('Armoured Courier Transit');
    expect(html).toContain('Doorstep Handover &amp; Signature');
  });

  it('4. Allows patron to switch between multiple orders via selector pills', () => {
    const html = renderToString(
      <CustomerTrackingTab
        orders={mockOrders}
        selectedOrder={mockOrders[1]}
        onSelectTab={vi.fn()}
      />
    );

    expect(html).toContain('YZ-ORD-2024-002');
    expect(html).toContain('BlueDart Apex Armoured');
    expect(html).toContain('BLUEDART-554433-IN');
  });

  it('5. Displays 100% transit insurance and tamper-proof security assurances', () => {
    const html = renderToString(
      <CustomerTrackingTab
        orders={mockOrders}
        onSelectTab={vi.fn()}
      />
    );

    expect(html).toContain('100% Transit Cover');
    expect(html).toContain('Tamper-Proof Seal');
    expect(html).toContain('OTP Handover');
    expect(html).toContain('15 Boat Club Road, RA Puram');
  });

  it('6. Renders empty state gracefully when patron has no active orders', () => {
    const html = renderToString(
      <CustomerTrackingTab
        orders={[]}
        onSelectTab={vi.fn()}
      />
    );

    expect(html).toContain('No Active Shipments in Transit');
    expect(html).toContain('live GPS tracking and courier telemetry will update here');
  });

  it('7. Handles cancelled consignment status with appropriate notice', () => {
    const cancelledOrder = [{
      id: 'ord-cancelled-1',
      order_number: 'YZ-ORD-CANCELLED',
      status: 'cancelled',
      carrier: 'Sequel Secure Logistics',
      tracking_number: 'SEQUEL-VOID',
      total_amount: 50000,
      created_at: '2024-10-18T10:00:00.000Z',
      items: [{ product_name: 'Silver Coin' }]
    }];

    const html = renderToString(
      <CustomerTrackingTab
        orders={cancelledOrder}
        onSelectTab={vi.fn()}
      />
    );

    expect(html).toContain('Consignment Dispatch Voided');
    expect(html).toContain('Cancelled');
  });
});
