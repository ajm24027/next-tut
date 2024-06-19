'use client';

// URLSearchParams is a Web API that provides utility methods for manipulating the URL query parameters. Instead of creating a complex string literal, you can use it to get the params string like ?page=1&query=a.
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  // useSearchParams() - Allows you to access the parameters of the current URL. For example, the search params for this URL /dashboard/invoices?page=1&query=pending would look like this: {page: '1', query: 'pending'}.
  const searchParams = useSearchParams();
  // usePathName() - Lets you read the current URL's pathname. For example, for the route /dashboard/invoices, usePathname would return '/dashboard/invoices'.
  const pathname = usePathname();
  // useRouter() - Enables navigation between routes within client components programmatically. We're destructuring or selecting the replace method from that hook. replace - Perform's a client-side navigation to the provided route without adding a new entry into the browser’s history stack.
  const { replace } = useRouter();

  // 1. Initializing a handleSearch function, that's using useDebouncedCallback(), the debounce will allow us to wait up to 300ms before calling the function back. This will let us wait 3s to collect input from the user, that way we don't fire off the function on everytime term updates per keystroke.
  const handleSearch = useDebouncedCallback((term) => {
    console.log(`Searching... ${term}`);
    // 2. Initialize a params variable that is a new URLSearchParams object.
    const params = new URLSearchParams(searchParams);
    // If term is present, SET the search param of Query to whatever term is. If there is no term (which is how it should be at the start), delete 'query' from the search params in the URL.
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
  }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        // pass an anonymous function taking in the event object or (e), and passing that events.target.value to the handleSearch function - in the handleSearch, this e.target.value is passed as term.
        onChange={(e) => handleSearch(e.target.value)}
        // default value is going to be populated by whatever the current search param is of query ("?query="). For example, when I manually type in ?query=test in the URL and press enter. The defualt value of this input is turned into test.
        defaultValue={searchParams.get('query')?.toString()}
      />
      <MagnifyingGlassIcon className="absolute left-3 top-1/2 h-[18px] w-[18px] -translate-y-1/2 text-gray-500 peer-focus:text-gray-900" />
    </div>
  );
}

// Debouncing is a programming practice that limits the rate at which a function can fire. In our case, you only want to query the database when the user has stopped typing.

// Trigger Event: When an event that should be debounced (like a keystroke in the search box) occurs, a timer starts.
// Wait: If a new event occurs before the timer expires, the timer is reset.
// Execution: If the timer reaches the end of its countdown, the debounced function is executed.

// By debouncing, you can reduce the number of requests sent to your database, thus saving resources.
