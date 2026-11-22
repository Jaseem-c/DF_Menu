import { AnnouncementBanner } from "@/components/menu/announcement-banner";
import { MenuBrowser } from "@/components/menu/menu-browser";
import { SiteFooter } from "@/components/menu/site-footer";
import { SiteHeader } from "@/components/menu/site-header";
import { getPublicMenu } from "@/lib/menu";

export default async function HomePage() {
  const { categories, items, settings } = await getPublicMenu();
  return (
    <>
      <SiteHeader settings={settings} />
      <AnnouncementBanner settings={settings} />
      <MenuBrowser categories={categories} items={items} />
      <SiteFooter settings={settings} />
    </>
  );
}
