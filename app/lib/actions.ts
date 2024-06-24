'use server';

import { z } from 'zod';
import { sql } from '@vercel/postgres';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';

// Tip: If you're working with forms that have many fields, you may want to consider using the entries()
// method with JavaScript's Object.fromEntries()

// . For example:

// const rawFormData = Object.fromEntries(formData.entries())

// Here we're creating a formSchema, to me this feels similar to type declaration, but in this case, we're declaring what properties should be and how they should be validated.
const FormSchema = z.object({
  id: z.string(),
  customerId: z.string(),
  // amount is both being coerced into a number and validated (is it a number?)
  amount: z.coerce.number(),
  status: z.enum(['pending', 'paid']),
  date: z.string(),
});

// We're creating a new FormSchema object with id and date omitted. As far as I know, this is because we're defining a custom date string later. And id is usually as I understand is created by the database itself.
const CreateInvoice = FormSchema.omit({ id: true, date: true });
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// This is defining a function that's taking in the data input from the form based on the form input IDs as arguments. It should be type formData.
export async function createInvoice(formData: FormData) {
  // We're destructuring the customerId, amount, and status values from the validated return object from the CreateInvoice.parse(). And we're passing in those formData from the forms, and assigning them them to keys (customerId, amount, status) which eventually be returned within the object.
  const { customerId, amount, status } = CreateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];
  // console.log({ customerId, amountInCents, status, date }, typeof amount);
  await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
`;

  // NextJS caches data from previously navigated pages. At this point, on /dashboard/invoices/create, when we insert the new database document, the cached data from /dashboard/invoices is out of sync - it has only the data from before we create the new db entry. The revalidation method will "refresh" the data that's displayed in /dashboard/invoices.
  revalidatePath('/dashboard/invoices');
  // redirect takes us back to the /dashboard/invoices page where we'll see the revalidated or refreshed page data and the invoice we just created.
  redirect('/dashboard/invoices');
}

export async function updateInvoice(id: string, formData: FormData) {
  const { customerId, amount, status } = UpdateInvoice.parse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  const amountInCents = amount * 100;

  await sql`
    UPDATE invoices
    SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
    WHERE id = ${id}
  `;

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  await sql`DELETE FROM invoices WHERE id = ${id}`;
  revalidatePath('/dashboard/invoices');
}
