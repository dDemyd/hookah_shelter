export function GuestFooter() {
  const year = new Date().getFullYear();

  return (
    <footer className="px-[22px] pt-6 pb-5 text-center">
      <div className="text-[11px] tracking-[1.5px] uppercase text-[#444]">
        @shelter 2021 - {year} · Біла Церква
      </div>
      <div className="mt-2 text-[11px] text-[#555]">
        Designed and Created by{" "}
        <a
          href="https://www.instagram.com/helldemid/"
          target="_blank"
          rel="noreferrer"
          className="font-semibold text-[#777] transition-colors hover:text-[#ff4500]"
        >
          helldemid
        </a>
      </div>
    </footer>
  );
}
