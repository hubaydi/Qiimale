export function Footer({ locale }: { locale: string }) {
  return (
    <footer className="bg-slate-900 text-white">
      <div className="mx-auto max-w-5xl px-4 py-12">
        <div className="grid grid-cols-1 gap-8 sm:grid-cols-3">
          <div>
            <span className="font-jakarta text-xl font-bold">Qiimale</span>
            <p className="mt-2 text-sm text-slate-400">
              {locale === "so"
                ? "Madal loogu talagalay in lagu qiimeeyo goobaha iyo adeegyada Soomaaliya"
                : "A platform for reviewing places and services in Somalia."}
            </p>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Quick links</h3>
            <ul className="mt-3 space-y-2 text-sm text-slate-300">
              <li>
                <a
                  href="/search"
                  className="hover:text-white transition-colors"
                >
                  Search
                </a>
              </li>
              <li>
                <a
                  href="/add-place"
                  className="hover:text-white transition-colors"
                >
                  Add a place
                </a>
              </li>
              <li>
                <a
                  href="/categories"
                  className="hover:text-white transition-colors"
                >
                  Categories
                </a>
              </li>
            </ul>
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">About</h3>
            <p className="mt-3 text-sm text-slate-400">
              {locale === "so"
                ? "Qiimale waa madal loogu talagalay in lagu qiimeeyo goobaha iyo adeegyada Ganacsi, Iyo in lagu soo bandhigo tajribada dadku kala kulmeen goobaha Ganacsi Soomaaliya. Gaar ahaan kuwa online-ka ah.."
                : "Qiimale is a platform for reviewing places and services in Somalia."}
            </p>
          </div>
        </div>
        <div className="mt-10 border-t border-slate-800 pt-6 text-center text-xs text-slate-400">
          Qiimale © {new Date().getFullYear()} · Made in Somalia
        </div>
      </div>
    </footer>
  );
}
