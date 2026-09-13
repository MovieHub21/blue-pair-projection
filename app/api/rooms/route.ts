import { NextResponse } from 'next/server'
import { createSupabasePublicClient } from '../../../lib/supabase/server'
export async function GET(request:Request){
 const typeId=new URL(request.url).searchParams.get('roomTypeId'); if(!typeId)return NextResponse.json([])
 const db=createSupabasePublicClient(); const {data,error}=await db.from('rooms').select('id,room_number,room_type_id,floor,status,name,slug,image_url').eq('room_type_id',typeId).order('room_number')
 if(error)return NextResponse.json({error:error.message},{status:500}); return NextResponse.json(data??[])
}
