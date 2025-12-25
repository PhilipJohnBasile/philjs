import { Sidebar, docsNavigation } from '@/components/Sidebar';

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex gap-12">
        <Sidebar sections={docsNavigation} />
        <main className="flex-1 min-w-0">
          <article className="prose prose-surface dark:prose-invert max-w-none">
            {children}
          </article>
        </main>
      </div>
    </div>
  );
}
