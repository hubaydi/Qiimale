export function Footer({ locale }: { locale: string }) {
  return (
    <footer className="border-t border-border bg-card text-card-foreground">
      <div className="mx-auto max-w-5xl px-4 py-14">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <span className="font-jakarta text-xl font-bold tracking-tight text-foreground">
              Qiimale
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              {locale === "so"
                ? "Madal loogu talagalay in lagu qiimeeyo goobaha iyo adeegyada Soomaaliya"
                : "A platform for reviewing places and services in Somalia."}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">
              Quick links
            </h3>
            <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
              <li>
                <a
                  href="/search"
                  className="transition-colors hover:text-primary"
                >
                  Search
                </a>
              </li>
              <li>
                <a
                  href="/places/add-place"
                  className="transition-colors hover:text-primary"
                >
                  Add a place
                </a>
              </li>
              <li>
                <a
                  href="/categories"
                  className="transition-colors hover:text-primary"
                >
                  Categories
                </a>
              </li>
              <li>
                <a
                  href="/categories/add-category"
                  className="transition-colors hover:text-primary"
                >
                  Add category
                </a>
              </li>
              <li>
                <a
                  href="/cities/add-city"
                  className="transition-colors hover:text-primary"
                >
                  Add city
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-foreground">About</h3>
            <p className="mt-3 text-sm text-muted-foreground">
              {locale === "so"
                ? "Qiimale waa madal loogu talagalay in lagu qiimeeyo goobaha iyo adeegyada ganacsi, iyo in lagu soo bandhigo waaya-aragnimada dadku kala kulmeen goobaha ganacsi ee Soomaaliya —gaar ahaan kuwa online-ka ah."
                : "Qiimale is a platform for reviewing places and services in Somalia."}
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-border pt-6 text-center text-xs text-muted-foreground">
          Qiimale © {new Date().getFullYear()} · Made in Somalia
        </div>
      </div>
    </footer>
  );
}
