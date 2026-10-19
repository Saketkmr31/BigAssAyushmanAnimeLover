import { redirect } from "next/navigation";
export default function RecentlyUpdatedPage(){redirect("/browse?sort=UPDATED_AT_DESC");}
