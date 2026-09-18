import Link from "next/link";
import { House } from "@phosphor-icons/react/dist/ssr/House";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="flex min-h-[100dvh] flex-col items-center justify-center gap-4 px-6 text-center">
      <span className="flex size-14 items-center justify-center rounded-2xl bg-muted">
        <House className="size-7 text-muted-foreground" weight="bold" />
      </span>
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Không tìm thấy trang</h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Trang bạn đang tìm kiếm không tồn tại hoặc đã bị di chuyển.
        </p>
      </div>
      <Link href="/mentor-app/home">
        <Button>
          <House className="size-4" weight="bold" /> Về trang chủ
        </Button>
      </Link>
    </div>
  );
}
