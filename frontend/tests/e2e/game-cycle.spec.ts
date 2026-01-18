import { test, expect } from "@playwright/test";

const USER = {
  username: "Prueba",
  password: "Prueba1.",
};

const GAME_NAME = `Test_Auto`;

test.describe("Complete Game with AI", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("http://localhost:5173/auth/login");
    await page.getByTestId("login-username").fill(USER.username);
    await page.getByTestId("login-password").fill(USER.password);
    await page.getByTestId("login-submit").click();
    await expect(page).toHaveURL("http://localhost:5173");
  });

  test("You should play, chat, win, exit, and check elimination.", async ({
    page,
  }) => {
    test.setTimeout(900000);
    await page.goto("http://localhost:5173/play");
    await page.getByTestId("btn-go-to-create").click();
    await page.getByTestId("input-game-name").fill(GAME_NAME);
    await page.getByTestId("checkbox-ai").check();
    await page.getByTestId("btn-create-game").click();

    await expect(page.getByTestId("sidebar-deck")).toBeVisible({
      timeout: 15000,
    });
    const myTurnIndicator = page.locator(".turn-info .your-turn");
    await expect(myTurnIndicator).toBeVisible({ timeout: 90000 });

    const columns = page.locator(".column");
    let revealed = false;

    for (let i = 0; i < (await columns.count()); i++) {
      const col = columns.nth(i);
      try {
        await col.click({ force: true });
        await expect(col).toHaveClass(/selected/, { timeout: 500 });
        revealed = true;
        break;
      } catch {
        break;
      }
    }

    if (revealed) await page.getByTestId("btn-reveal-card").click();

    await page.waitForTimeout(1000);
    await expect(myTurnIndicator).toBeVisible({ timeout: 90000 });

    const colToTake = page
      .locator(".column")
      .filter({ has: page.locator(".card") })
      .first();
    if ((await colToTake.count()) > 0) await colToTake.click({ force: true });
    else await page.locator(".column").first().click({ force: true });

    await page.waitForTimeout(500);
    const takeBtn = page.getByTestId("btn-take-column");
    const revealBtn = page.getByTestId("btn-reveal-card");

    if (await takeBtn.isEnabled()) await takeBtn.click();
    else if (await revealBtn.isEnabled()) await revealBtn.click();

    const endRoundImg = page.getByTestId("img-end-round-active");
    const gameOverOverlay = page.getByTestId("overlay-game-over");
    let gameFinished = false;
    let turnCount = 0;
    let chatTestDone = false;

    while (!gameFinished) {
      turnCount++;

      if (await gameOverOverlay.isVisible()) {
        gameFinished = true;
        break;
      }

      await expect
        .poll(
          async () => {
            return (
              (await myTurnIndicator.isVisible()) ||
              (await gameOverOverlay.isVisible())
            );
          },
          { timeout: 90000 },
        )
        .toBeTruthy();

      if (await gameOverOverlay.isVisible()) {
        gameFinished = true;
        break;
      }

      if (turnCount === 2 && !chatTestDone) {
        const chatInput = page.locator("#messageInput");
        await chatInput.fill("Message test");
        await page.locator(".submitChat").click();
        await expect(page.locator(".message-item").last()).toContainText(
          "Message",
        );

        await page.locator(".emoticon-button").click();
        const emojiPanel = page.locator(".emoticon-list");
        await expect(emojiPanel).toBeVisible();
        await emojiPanel.locator(".emoticon-item").first().click();
        await page.locator(".submitChat").click();

        const lastMsg = page.locator(".message-item").last();
        const reactionTrigger = lastMsg.locator(".reaction-button");

        await expect(async () => {
          await lastMsg.scrollIntoViewIfNeeded();
          await lastMsg.hover({ force: true });
          await expect(reactionTrigger).toBeVisible({ timeout: 1000 });
        }).toPass({ timeout: 10000 });

        await reactionTrigger.click();
        const reactionPicker = page.locator(".reaction-picker");
        await expect(reactionPicker).toBeVisible();

        const reactionEmoji = reactionPicker
          .locator(".reaction-button")
          .first();
        await reactionEmoji.click();

        chatTestDone = true;
      }

      let played = false;
      const totalCols = await columns.count();

      for (let i = 0; i < totalCols; i++) {
        const col = columns.nth(i);
        try {
          await col.click({ force: true });
        } catch {
          continue;
        }
        await page.waitForTimeout(100);

        if (await revealBtn.isEnabled()) {
          await revealBtn.click();
          played = true;
          if (await endRoundImg.isVisible()) break;
        }
      }

      if (!played) {
        const validCols = page
          .locator(".column")
          .filter({ has: page.locator(".card") });
        if ((await validCols.count()) > 0) {
          await validCols.first().click({ force: true });
          await page.waitForTimeout(200);
          if (await takeBtn.isEnabled()) {
            await takeBtn.click();
            await page.waitForTimeout(3000);
          }
        } else {
          if (await takeBtn.isEnabled()) await takeBtn.click();
        }
      }
    }

    await expect(gameOverOverlay).toBeVisible();
    await expect(
      gameOverOverlay.locator(".scores-total-value").first(),
    ).toBeVisible();

    const closeOverlayBtn = gameOverOverlay.locator(".scores-close-btn");
    await expect(closeOverlayBtn).toBeVisible();
    await closeOverlayBtn.click();
    await expect(gameOverOverlay).toBeHidden();

    const exitGameBtn = page
      .getByTestId("btn-exit-game")
      .or(page.getByRole("button", { name: /salir|exit|home/i }))
      .first();

    if (await exitGameBtn.isVisible()) {
      await exitGameBtn.click();
    } else {
      await page.goto("http://localhost:5173/play/join");
    }

    await expect(page).toHaveURL(/.*\/play\/join/);
    await expect
      .poll(
        async () => {
          const gameCard = page.locator(".game-card", { hasText: GAME_NAME });
          const count = await gameCard.count();
          return count;
        },
        {
          timeout: 45000,
          intervals: [3000],
        },
      )
      .toBe(0);

    const profileMenu = page.getByTestId("btn-profile-menu");
    if (await profileMenu.isVisible()) await profileMenu.click();

    const logoutBtn = page
      .getByTestId("btn-logout")
      .or(page.getByRole("button", { name: /logout|cerrar/i }))
      .first();
    await logoutBtn.click();

    await expect(page).toHaveURL("http://localhost:5173");
  });
});
