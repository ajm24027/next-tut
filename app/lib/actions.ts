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
  // Invalid Type error is an accessibility property to give better feedback to our users.
  customerId: z.string({ invalid_type_error: 'Please select a customer.' }),
  // amount is both being coerced into a number and validated (is it a number?)
  // Because of the coercion from string to number, it'll default to 0 if the string is empty. With .gt, we'll tell it that we always want an amount greater or gt than 0.
  amount: z.coerce
    .number()
    .gt(0, { message: 'Please enter an amount greater than $0.' }),
  status: z.enum(['pending', 'paid'], {
    invalid_type_error: 'Please select an invoice status',
  }),
  date: z.string(),
});

export type State = {
  errors?: {
    customerId?: string[];
    amount?: string[];
    status?: string[];
  };
  message?: string | null;
};

// We're creating a new FormSchema object with id and date omitted. As far as I know, this is because we're defining a custom date string later. And id is usually as I understand is created by the database itself.
const CreateInvoice = FormSchema.omit({ id: true, date: true });
// Use Zod to update the expected types
const UpdateInvoice = FormSchema.omit({ id: true, date: true });

// This is defining a function that's taking in the data input from the form based on the form input IDs as arguments. It should be type formData.
export async function createInvoice(prevState: State, formData: FormData) {
  // safeParse() will return an object containing either a success or error field. This will help handle validation more gracefully without having put this logic inside the try/catch block.

  const validatedFields = CreateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  // If form validation fails, return errors early. Otherwise, continue.
  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Create Invoice.',
    };
  }

  // Prepare data for insertion into the database
  // We're destructuring the customerId, amount, and status values from the validated return object from the CreateInvoice.safeParse(). And we're passing in those formData from the forms, and assigning them them to keys (customerId, amount, status) which eventually be returned within the object.
  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;
  const date = new Date().toISOString().split('T')[0];

  // above we handle the action logic, once we have all of the database values added and formatted, then we try to add it to the database, and catch an error if there's an issue.

  // The try...catch statement is comprised of a try block and either a catch block, a finally block, or both. The code in the try block is executed first, and if it throws an exception - error, the code in the catch block will be executed. The code in the finally block will always be executed before control flow exits the entire construct.

  try {
    await sql`
  INSERT INTO invoices (customer_id, amount, status, date)
  VALUES (${customerId}, ${amountInCents}, ${status}, ${date})
`;
  } catch (error) {
    return {
      message: 'Database Error: Failed to create invoice.',
    };
  }

  // NextJS caches data from previously navigated pages. At this point, on /dashboard/invoices/create, when we insert the new database document, the cached data from /dashboard/invoices is out of sync - it has only the data from before we create the new db entry. The revalidation method will "refresh" the data that's displayed in /dashboard/invoices.
  revalidatePath('/dashboard/invoices');
  // redirect takes us back to the /dashboard/invoices page where we'll see the revalidated or refreshed page data and the invoice we just created.
  redirect('/dashboard/invoices');
}

export async function updateInvoice(
  id: string,
  prevState: State,
  formData: FormData,
) {
  const validatedFields = UpdateInvoice.safeParse({
    customerId: formData.get('customerId'),
    amount: formData.get('amount'),
    status: formData.get('status'),
  });

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
      message: 'Missing Fields. Failed to Update Invoice.',
    };
  }

  const { customerId, amount, status } = validatedFields.data;
  const amountInCents = amount * 100;

  try {
    await sql`
        UPDATE invoices
        SET customer_id = ${customerId}, amount = ${amountInCents}, status = ${status}
        WHERE id = ${id}
      `;
  } catch (error) {
    return { message: 'Database Error: Failed to Update Invoice.' };
  }

  revalidatePath('/dashboard/invoices');
  redirect('/dashboard/invoices');
}

export async function deleteInvoice(id: string) {
  throw new Error('failed to delete invoice');
  try {
    await sql`DELETE FROM invoices WHERE id = ${id}`;
    revalidatePath('/dashboard/invoices');
    return { message: 'Deleted Invoice.' };
  } catch (error) {
    return { message: 'Database Error: Failed to Delete Invoice.' };
  }
}

// Note how redirect is being called outside of the try/catch block. This is because redirect works by throwing an error, which would be caught by the catch block. To avoid this, you can call redirect after try/catch. redirect would only be reachable if try is successful.
