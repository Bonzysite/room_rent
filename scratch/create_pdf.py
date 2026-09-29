import os

def build_pdf(output_path):
    blueprint_text = [
        "RoomShare Platform - Architecture & Structure Blueprint",
        "=======================================================",
        "",
        "1. Executive Platform Summary",
        "RoomShare is a modern, high-performance web platform for residential room and house rentals in Ghana.",
        "It supports dual-role access control for Landlords and Tenants.",
        "Key capabilities: listing management, verified room discovery, direct messaging, end-to-end lease workflow.",
        "",
        "2. Technology Stack",
        "- Frontend: React 19 + TypeScript + Vite 6",
        "- Styling: Tailwind CSS v4",
        "- Iconography & Motion: Lucide React icons + Framer Motion",
        "- Backend: Express.js on Node.js (Port 3000)",
        "- Persistence: Server-side JSON DB (data/db.json) + local client sync",
        "- Image Optimizer: Canvas-based client downscaling to ~1400px",
        "",
        "3. System Components & Routes",
        "- Room Discovery & Filter Engine (App.tsx & FilterBar.tsx)",
        "- Room Details Modal (RoomDetailModal.tsx)",
        "- Landlord Dashboard & Listing Wizard (LandlordDashboard.tsx)",
        "- Tenant Hub & Tracker (TenantApplicationsView.tsx)",
        "- Real-Time Inbox (MessagesView.tsx)",
        "- Lease Application Modal (ApplicationModal.tsx)",
        "",
        "4. REST API Endpoints",
        "- GET /api/data",
        "- POST /api/sync",
        "- GET / POST / PUT / DELETE /api/rooms",
        "- GET / POST / PUT /api/users",
        "- GET / POST / PUT /api/applications",
        "- GET / POST /api/conversations",
        "- GET / POST /api/messages",
        "- GET /website-structure.pdf"
    ]

    # Simple valid PDF 1.4 generator
    page_content = ["BT /F1 10 Tf 14 TL 40 750 Td"]
    for line in blueprint_text:
        escaped = line.replace('(', '\\(').replace(')', '\\)')
        page_content.append(f"({escaped}) '")
    page_content.append("ET")
    stream_data = "\n".join(page_content).encode('utf-8')

    objects = []
    # 1 0 obj: Catalog
    objects.append(b"1 0 obj\n<< /Type /Catalog /Pages 2 0 R >>\nendobj\n")
    # 2 0 obj: Pages
    objects.append(b"2 0 obj\n<< /Type /Pages /Kids [3 0 R] /Count 1 >>\nendobj\n")
    # 3 0 obj: Page
    objects.append(b"3 0 obj\n<< /Type /Page /Parent 2 0 R /Resources << /Font << /F1 4 0 R >> >> /MediaBox [0 0 612 792] /Contents 5 0 R >>\nendobj\n")
    # 4 0 obj: Font
    objects.append(b"4 0 obj\n<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>\nendobj\n")
    # 5 0 obj: Stream
    objects.append(f"5 0 obj\n<< /Length {len(stream_data)} >>\nstream\n".encode('utf-8') + stream_data + b"\nendstream\nendobj\n")

    header = b"%PDF-1.4\n"
    body = b"".join(objects)
    
    # Calculate xref
    xref_offset = len(header) + len(body)
    xref_entries = [b"0000000000 65535 f \n"]
    offset = len(header)
    for obj in objects:
        xref_entries.append(f"{offset:010d} 00000 n \n".encode('utf-8'))
        offset += len(obj)

    xref = b"xref\n0 6\n" + b"".join(xref_entries)
    trailer = f"trailer\n<< /Size 6 /Root 1 0 R >>\nstartxref\n{xref_offset}\n%%EOF\n".encode('utf-8')

    os.makedirs(os.path.dirname(output_path), exist_ok=True)
    with open(output_path, "wb") as f:
        f.write(header + body + xref + trailer)

    print(f"Generated PDF at {output_path} ({os.path.getsize(output_path)} bytes)")

build_pdf("public/website-structure.pdf")
