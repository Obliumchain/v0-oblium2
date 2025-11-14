import { type NextRequest, NextResponse } from "next/server"
import { createClient } from "@/lib/supabase/server"

export async function GET(request: NextRequest) {
  try {
    const supabase = await createClient()

    const { data: boosters, error } = await supabase.from("boosters").select("*").eq("active", true).order("price_sol")

    if (error) {
      console.error("Error fetching boosters:", error)
      return NextResponse.json({ error: "Failed to fetch boosters" }, { status: 500 })
    }

    return NextResponse.json({ boosters })
  } catch (error) {
    console.error("Boosters API error:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
