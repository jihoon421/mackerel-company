import { expect, test } from '@playwright/test';

test('1인 근무가 메뉴에서 실제 게임 월드까지 진입한다', async ({ page }) => {
  const errors:string[]=[];page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));
  await page.goto('/');
  await expect(page.getByRole('heading', { name: '고등어 회사' })).toBeVisible();
  await page.getByTestId('solo-button').click();
  await page.getByTestId('solo-mode').click();
  await expect(page.getByText(/출근 브리핑/)).toBeVisible();
  await page.getByTestId('start-day').click();
  await expect(page.getByLabel('게임 화면')).toBeVisible();
  await expect(page.locator('canvas')).toBeVisible();
  await page.keyboard.down('KeyD');
  await page.waitForTimeout(350);
  await page.keyboard.up('KeyD');
  await expect(page.locator('.quota')).toContainText('회수');
  expect(errors).toEqual([]);
});

test('두 브라우저가 6자리 코드로 같은 공동 근무 방에 참가한다', async ({ browser }) => {
  const hostContext = await browser.newContext();
  const guestContext = await browser.newContext();
  const host = await hostContext.newPage();
  const guest = await guestContext.newPage();
  const errors:string[]=[];for(const page of [host,guest]){page.on('console',message=>{if(message.type()==='error')errors.push(message.text());});page.on('pageerror',error=>errors.push(error.message));}
  try {
    await host.goto('/');
    await host.getByTestId('solo-button').click();
    await host.getByRole('button', { name: /2인 공동 근무/ }).click();
    await host.getByLabel('사원명').fill('방장고등어');
    await host.getByTestId('create-room').click();
    const code = (await host.locator('.room-code strong').textContent())?.trim() ?? '';
    expect(code).toMatch(/^\d{6}$/);

    await guest.goto('/');
    await guest.getByTestId('solo-button').click();
    await guest.getByRole('button', { name: /2인 공동 근무/ }).click();
    await guest.getByLabel('사원명').fill('동료고등어');
    await guest.getByLabel('방 코드').fill(code);
    await guest.getByRole('button', { name: '참가' }).click();

    await expect(host.getByText('동료고등어')).toBeVisible();
    await expect(guest.getByText('방장고등어')).toBeVisible();
    await host.getByRole('button', { name: '준비' }).click();
    await guest.getByRole('button', { name: '준비' }).click();
    await expect(host.getByRole('button', { name: '출근' })).toBeEnabled();
    await host.getByRole('button', { name: '출근' }).click();
    await expect(host.getByLabel('게임 화면')).toBeVisible();
    await expect(guest.getByLabel('게임 화면')).toBeVisible();
    expect(errors).toEqual([]);
  } finally {
    await hostContext.close();
    await guestContext.close();
  }
});
