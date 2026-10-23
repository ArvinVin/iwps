import {test,expect} from '@playwright/test';
test('seat selection, POV URL, information and overview work',async({page})=>{
 const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await expect(page.getByText('Menyiapkan arena…')).toHaveCount(0);
 await page.waitForTimeout(1800);await page.screenshot({path:'/tmp/iwps-desktop.png'});
 await page.getByRole('button',{name:'Gold',exact:false}).click();await page.getByRole('combobox',{name:'Blok',exact:true}).selectOption('B');await page.getByRole('combobox',{name:'Baris',exact:true}).selectOption('6');await page.getByRole('combobox',{name:'Nomor kursi',exact:true}).selectOption('20');
 await page.getByRole('button',{name:'Lihat dari kursi ini'}).click();await expect(page).toHaveURL(/zone=gold&blk=B&row=6&seat=20&view=pov/);await expect(page.locator('.pov-info')).toContainText('Gold B');
 await page.waitForTimeout(1500);await page.screenshot({path:'/tmp/iwps-pov.png'});
 await page.reload();await expect(page.getByRole('combobox',{name:'Baris',exact:true})).toHaveValue('6');await expect(page.locator('.pov-info')).toBeVisible();
 await page.getByRole('button',{name:'Tentang simulasi'}).click();await expect(page.locator('dialog')).toBeVisible();await page.keyboard.press('Escape');await expect(page.locator('dialog')).not.toBeVisible();
 await page.getByRole('button',{name:'Dari atas',exact:true}).click();await expect(page).toHaveURL(/view=top/);expect(errors).toEqual([]);
});
test('mobile seat panel collapses after choosing POV and reopens',async({page})=>{
 await page.setViewportSize({width:390,height:844});await page.goto('/');await expect(page.locator('canvas')).toBeVisible();await page.getByRole('button',{name:'Lihat dari kursi ini'}).click();await expect(page.locator('.sidebar')).not.toBeVisible();await page.getByRole('button',{name:'Overview',exact:true}).click();await page.waitForTimeout(1500);await page.screenshot({path:'/tmp/iwps-mobile.png'});await page.getByRole('button',{name:'Buka pilihan kursi'}).click();await expect(page.locator('.sidebar')).toBeVisible();expect(await page.evaluate(()=>document.documentElement.scrollWidth<=window.innerWidth)).toBeTruthy();
});
test('WebGL failure preserves a usable seat selector and 2D plan',async({page})=>{
 await page.addInitScript(()=>{const original=HTMLCanvasElement.prototype.getContext;HTMLCanvasElement.prototype.getContext=function(type,...args){if(type.startsWith('webgl'))return null;return original.call(this,type,...args);};});await page.goto('/');await expect(page.getByRole('heading',{name:'Jelajahi denah arena'})).toBeVisible();await page.getByRole('button',{name:'Pilih Gold',exact:true}).click();await expect(page.getByRole('combobox',{name:'Blok',exact:true})).toHaveValue('A');await expect(page.getByRole('button',{name:'Lihat dari kursi ini'})).toBeDisabled();await expect(page).toHaveURL(/zone=gold/);
});
