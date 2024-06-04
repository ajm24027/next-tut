'use client';

// URLSearchParams is a Web API that provides utility methods for manipulating the URL query parameters. Instead of creating a complex string literal, you can use it to get the params string like ?page=1&query=a.
import { useSearchParams, usePathname, useRouter } from 'next/navigation';
import { MagnifyingGlassIcon } from '@heroicons/react/24/outline';
import { useDebouncedCallback } from 'use-debounce';

export default function Search({ placeholder }: { placeholder: string }) {
  // 2. Initialize Search params
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const { replace } = useRouter();

  // 1. Capture the user input > we use the handleSearch to take in a string.
  // 3. Create an instance of searchParams based on the term coming from the handleSearch Function.
  const handleSearch = useDebouncedCallback((term) => {
    console.log(`Searching... ${term}`);
    const params = new URLSearchParams(searchParams);
    // set - what looks to be a method, updates the params based on user input. If it's empty, use delete method to delete the 'query'.
    if (term) {
      params.set('query', term);
    } else {
      params.delete('query');
    }
    replace(`${pathname}?${params.toString()}`);
    // /pathname/?params=term
    // /dashboard/invoices?query=lee
    // Pathname is the usePathname() which sense our current path or /dashboard/invoices.
    // When we go params.set() we're creating the params that follow that path. Or in our case ('query', term)
    // The params is query and the query is = term.
  }, 300);

  return (
    <div className="relative flex flex-1 flex-shrink-0">
      <label htmlFor="search" className="sr-only">
        Search
      </label>
      <input
        className="peer block w-full rounded-md border border-gray-200 py-[9px] pl-10 text-sm outline-2 placeholder:text-gray-500"
        placeholder={placeholder}
        // pass an anonymous function taking in the event object or (e), and passing that events.target.value to the handleSearch function.
        onChange={(e) => handleSearch(e.target.value)}
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
