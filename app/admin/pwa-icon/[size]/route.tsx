import { ImageResponse } from "next/og";

// App icon generated on the fly: /admin/pwa-icon/192?kind=admin|scan[&maskable=1]
// (Replace with your own PNGs in /public whenever you like and point the manifests to them.)
export async function GET(req: Request, { params }: { params: Promise<{ size: string }> }) {
    const { size: raw } = await params;
    const size = Math.min(Math.max(parseInt(raw, 10) || 192, 48), 1024);
    const url = new URL(req.url);
    const scan = url.searchParams.get("kind") === "scan";
    const inner = Math.round(size * (url.searchParams.has("maskable") ? 0.6 : 0.84)); // maskable icons must keep the art inside the central safe zone

    return new ImageResponse(
        (
            <div style={{ width: size, height: size, display: "flex", alignItems: "center", justifyContent: "center", background: "#0a0809" }}>
                <div
                    style={{
                        width: inner, height: inner, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
                        borderRadius: inner, border: `${Math.max(2, Math.round(size / 56))}px solid #d4af37`,
                        backgroundImage: "radial-gradient(circle at 50% 30%, #7a0f1a, #0a0809)", color: "#f1d48a",
                    }}
                >
                    <div style={{ display: "flex", fontSize: Math.round(inner * 0.36), lineHeight: 1 }}>P&amp;A</div>
                    <div style={{ display: "flex", marginTop: Math.round(inner * 0.06), fontSize: Math.round(inner * 0.09), letterSpacing: Math.round(inner * 0.02), color: "#d4af37" }}>
                        {scan ? "ENTRÉE" : "ADMIN"}
                    </div>
                </div>
            </div>
        ),
        { width: size, height: size },
    );
}