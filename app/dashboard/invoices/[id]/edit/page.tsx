// Steps to implementing the update invoice feature:
// 1. Create a new dynamic route segment with the invoice id. -- See Invoices/[id]/edit/page.tsx
// 2. Read the invoice id from the page params. -- See ui/invoices/buttons/updateinvoice function
// 3. Fetch the specific invoice from your database. -- See ui/invoices/buttons/updateinvoice function where we use template literals to pass the invoice id prop to the href.
// 4. Pre-populate the form with the invoice data. -- See const [invoice, customers] = await Promise.all(...)
// 5. Update the invoice data in your database.

// Lastly, you want to pass the id to the Server Action so you can update the right record in your database. You cannot pass the id as an argument like so:
// <form action={updateInvoice(id)}>

// Instead, you can pass id to the Server Action using JS bind. This will ensure that any values passed to the Server Action are encoded.

import Form from '@/app/ui/invoices/edit-form';
import Breadcrumbs from '@/app/ui/invoices/breadcrumbs';
import { fetchCustomers, fetchInvoiceById } from '@/app/lib/data';

export default async function Page({ params }: { params: { id: string } }) {
  const id = params.id;
  const [invoice, customers] = await Promise.all([
    fetchInvoiceById(id),
    fetchCustomers(),
  ]);
  return (
    <main>
      <Breadcrumbs
        breadcrumbs={[
          { label: 'Invoices', href: '/dashboard/invoices' },
          {
            label: 'Edit Invoice',
            href: `/dashboard/invoices/${id}/edit`,
            active: true,
          },
        ]}
      />
      <Form invoice={invoice} customers={customers} />
    </main>
  );
}
