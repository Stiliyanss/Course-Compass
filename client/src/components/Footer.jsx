export default function Footer() {
  return (
    <footer className="border-t border-slate-800 bg-slate-950 py-8">
      <div className="mx-auto max-w-7xl px-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Course Compass. All rights reserved.
      </div>
    </footer>
  );
}
