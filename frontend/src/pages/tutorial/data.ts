import { DriveStep } from "driver.js";
import { useLanguageStore } from "@/context/store/LanguageStore";
import { getCardImage } from "@/hooks/game/useCardImages";
import crownIcon from "@/assets/owner/crown.webp";
import trophy from "@/assets/winner/trophy.webp";

export const getInitialTutorialState = () => {
  const { t } = useLanguageStore.getState();
  const nameYou = t("tutorialJSX.you");
  const basePlayer = t("tutorialJSX.player");

  const nameP2 = `${basePlayer}_2`;
  const nameP3 = `${basePlayer}_3`;
  const nameP4 = `${basePlayer}_4`;
  const nameP5 = `${basePlayer}_5`;

  return {
    gameName: "Tutorial",
    isPrepared: true,
    isFinished: false,
    isPaused: false,
    currentRound: 2,
    currentPlayerIndex: 0,
    players: [nameYou, nameP2, nameP3],
    aiPlayers: [{ name: nameP4 }, { name: nameP5 }],
    playersTakenColumn: [] as string[],
    isRoundCardRevealed: false,
    maxPlayers: 5,
    deck: Array(66).fill({ color: "deck" }),
    columns: [
      {
        cards: [{ color: "brown_column" }, { color: "red" }, { color: "blue" }],
      },
      {
        cards: [
          { color: "brown_column" },
          { color: "yellow" },
          { color: "cotton" },
        ],
      },
      {
        cards: [
          { color: "brown_column" },
          { color: "wild" },
          { color: "purple" },
        ],
      },
      {
        cards: [
          { color: "brown_column" },
          { color: "brown" },
          { color: "orange" },
        ],
      },
      {
        cards: [
          { color: "brown_column" },
          { color: "green" },
          { color: "green" },
          { color: "cotton" },
        ],
      },
    ],
    playerCollections: {
      [nameYou]: [
        { color: "red" },
        { color: "red" },
        { color: "blue" },
        { color: "green" },
      ],
      [nameP2]: [{ color: "yellow" }, { color: "purple" }, { color: "brown" }],
      [nameP3]: [{ color: "orange" }, { color: "blue" }, { color: "cotton" }],
      [nameP4]: [{ color: "green" }, { color: "green" }, { color: "wild" }],
      [nameP5]: [{ color: "green" }, { color: "red" }, { color: "red" }],
    },

    wildCards: {
      [nameYou]: [],
      [nameP2]: [],
      [nameP3]: [{ color: "golden_wild" }],
      [nameP4]: [],
      [nameP5]: [],
    },

    summaryCards: {
      [nameYou]: [{ color: "summary_brown" }],
      [nameP2]: [{ color: "summary_brown" }],
      [nameP3]: [{ color: "summary_brown" }],
      [nameP4]: [{ color: "summary_brown" }],
      [nameP5]: [{ color: "summary_brown" }],
    },
  };
};

export const getInterfaceSteps = (): DriveStep[] => {
  const summary_brown = getCardImage("summary_brown");
  const summary_violet = getCardImage("summary_violet");
  const { t } = useLanguageStore.getState();

  return [
    {
      popover: {
        title: t("tutorial.welcome.title"),
        description: `
    <div class="welcome-content">
      <strong>${t("tutorial.welcome.subtitle")}</strong>
      <ul class="welcome-list">
        <li>${t("tutorial.welcome.li1")}</li>
        <li>${t("tutorial.welcome.li2")}</li>
        <li>${t("tutorial.welcome.li3")}</li>
      </ul>
      <em>${t("tutorial.welcome.footer")}</em>
    </div>
  `,
        align: "center",
      },
    },
    {
      element: ".game-header",
      popover: {
        title: t("tutorial.header.title"),
        description: `
  <div class="game-header-info">
    <div class="info-row">
      <strong>${t("tutorial.header.labelTut")}</strong>
      <span class="info-value">${t("tutorial.header.valGame")}</span>
    </div>
    <div class="info-row">
      <strong>${t("tutorial.header.labelTurn")}</strong>
      <span class="info-value">${t("tutorial.header.valTurn")}</span>
    </div>
    <div class="your-turn">${t("tutorial.header.yourTurn")}</div>
  </div>
`,
        side: "bottom",
        align: "center",
      },
    },
    {
      element: ".deck-section",
      popover: {
        title: t("tutorial.deck.title"),
        description: `
    <div class="deck-info">
      <ul>
        <li>${t("tutorial.deck.li1")}</li>
        <li>${t("tutorial.deck.li2")}</li>
        <li>${t("tutorial.deck.li3")}</li>
      </ul>
    </div>
  `,
        side: "right",
        align: "center",
      },
    },
    {
      element: ".summary-section",
      popover: {
        title: t("tutorial.summary.title"),
        description: `
      <div class="tutorial-summary-content">
        <strong class="title-summary">${t(
          "tutorial.summary.descTitle"
        )}</strong><br/>
        ${t("tutorial.summary.descSub")}<br/>
        
        <div class="summary-cards-comparison">
          <div class="summary-card-type">
            <div class="summary-card-title brown">${t(
              "tutorial.summary.brownTitle"
            )}</div>
            <img src="${summary_brown}" alt="Brown Summary" class="summary-card-image"/>
            <div class="summary-card-points">
              <strong>${t("tutorial.summary.brownPoints")}</strong><br/>
              ${t("tutorial.summary.brownList")}
            </div>
          </div>
          
          <div class="summary-card-type">
            <div class="summary-card-title violet">${t(
              "tutorial.summary.violetTitle"
            )}</div>
            <img src="${summary_violet}" alt="Violet Summary" class="summary-card-image"/>
            <div class="summary-card-points">
              <strong>${t("tutorial.summary.violetPoints")}</strong><br/>
              ${t("tutorial.summary.violetList")}
            </div>
          </div>
        </div>
      </div>
    `,
        side: "right",
        align: "center",
      },
    },
    {
      element: ".game-center",
      popover: {
        title: t("tutorial.columns.title"),
        description: `
      <div class="tutorial-columns-content">
        <div class="columns-main-info">
          <strong>${t("tutorial.columns.mainInfo")}</strong>
          <ul class="columns-list">
            <li>${t("tutorial.columns.li1")}</li>
            <li>${t("tutorial.columns.li2")}</li>
            <li>${t("tutorial.columns.li3")}</li>
          </ul>
        </div>
      </div>
    `,
        side: "top",
        align: "center",
      },
    },
    {
      element: ".players-sidebar",
      popover: {
        title: t("tutorial.players.title"),
        description: `
      <div class="tutorial-players-content">
        <div class="players-explanation">
          <div class="player-type">
            <span class="player-color green"></span>
            <div class="player-text"><strong>${t(
              "tutorial.players.green"
            )}</strong> ${t("tutorial.players.greenDesc")}</div>
          </div>
          <div class="player-type">
            <span class="player-color orange"></span>
            <div class="player-text"><strong>${t(
              "tutorial.players.orange"
            )}</strong> ${t("tutorial.players.orangeDesc")}</div>
          </div>
        </div>
        
        <div class="players-actions">
          <div class="action-item">
            <div class="action-icon">👁️</div>
            <div class="action-text">${t("tutorial.players.actionText")}</div>
          </div>
        </div>
        
        <div class="players-card-types">
          <div class="card-type">
            <div class="card-type-title">${t("tutorial.players.colTitle")}</div>
            <div class="card-type-description">${t(
              "tutorial.players.colDesc"
            )}</div>
          </div>
          <div class="card-type">
            <div class="card-type-title">${t(
              "tutorial.players.wildTitle"
            )}</div>
            <div class="card-type-description">${t(
              "tutorial.players.wildDesc"
            )}</div>
          </div>
        </div>

         <div class="owner-info">
      <img src="${crownIcon}" alt="Crown" class="owner-icon-img" />
      <div class="owner-text">
        ${t("tutorial.players.ownerText")}
      </div>
    </div>
  </div>
    `,
        side: "left",
        align: "center",
      },
    },
    {
      element: ".gamepage-actions",
      popover: {
        title: t("tutorial.actions.title"),
        description: `
      <div class="tutorial-actions-content">
        <div class="actions-intro">
          <strong>${t("tutorial.actions.intro")}</strong>
        </div>
        
        <div class="action-steps">
          <div class="action-step">
            <div class="step-number">1</div>
            <div class="step-content">
              <div class="step-title">${t("tutorial.actions.revTitle")}</div>
              <div class="step-description">${t(
                "tutorial.actions.revDesc"
              )}</div>
            </div>
          </div>
          
          <div class="action-step">
            <div class="step-number">2</div>
            <div class="step-content">
              <div class="step-title">${t("tutorial.actions.takeTitle")}</div>
              <div class="step-description">${t(
                "tutorial.actions.takeDesc"
              )}</div>
            </div>
          </div>
          
          <div class="action-step">
            <div class="step-number">3</div>
            <div class="step-content">
              <div class="step-title">${t("tutorial.actions.leaveTitle")}</div>
              <div class="step-description">${t(
                "tutorial.actions.leaveDesc"
              )}</div>
            </div>
          </div>
        </div>
    `,
        side: "top",
        align: "center",
      },
    },
    {
      popover: {
        title: t("tutorial.interfaceLearned.title"),
        description: `
      <div class="tutorial-interface-complete">
        <div class="complete-title">${t(
          "tutorial.interfaceLearned.perfect"
        )}</div>
        
        <div class="next-steps">
          <div class="next-title">${t(
            "tutorial.interfaceLearned.nextTitle"
          )}</div>
          <div class="next-items">
            <div class="next-item">
              <div class="next-text">${t(
                "tutorial.interfaceLearned.next1"
              )}</div>
            </div>

            <div class="next-item">
              <div class="next-text">${t(
                "tutorial.interfaceLearned.next2"
              )}</div>
            </div>
           
            <div class="next-item">
              <div class="next-text">${t(
                "tutorial.interfaceLearned.next3"
              )}</div>
            </div>
          </div>
        </div>
        
        <div class="continue-section">
          <div class="continue-text">${t(
            "tutorial.interfaceLearned.continue"
          )}</div>
        </div>
      </div>
    `,
        align: "center",
      },
    },
  ];
};

export const getMechanicsSteps = (): DriveStep[] => {
  const green_column_0 = getCardImage("green_column_0");
  const green_column_1 = getCardImage("green_column_1");
  const green_column_2 = getCardImage("green_column_2");
  const brown_column = getCardImage("brown_column");
  const chameleonRed = getCardImage("red");
  const chameleonBlue = getCardImage("blue");
  const chameleonGreen = getCardImage("green");
  const chameleonBrown = getCardImage("brown");
  const chameleonOrange = getCardImage("orange");
  const chameleonPurple = getCardImage("purple");
  const chameleonYellow = getCardImage("yellow");
  const cotton = getCardImage("cotton");
  const wild = getCardImage("wild");
  const golden_wild = getCardImage("golden_wild");
  const endRound = getCardImage("endRound");
  const { t } = useLanguageStore.getState();

  return [
    {
      popover: {
        title: t("tutorial.mechanics.title"),
        description: `
        <div class="tutorial-mechanics-intro">
          <div class="mechanics-title">${t("tutorial.mechanics.intro")}</div>
          <div class="mechanics-subtitle">${t("tutorial.mechanics.sub")}</div>
        </div>
      `,
        align: "center",
      },
    },
    {
      element: ".deck-section",
      popover: {
        title: t("tutorial.mechanics.cardsTitle"),
        description: `
      <div class="tutorial-cards-deck">
        <div class="cards-intro">
          <strong>${t("tutorial.mechanics.cardsIntro")}</strong>
        </div>
        
        <div class="cards-grid">
          <div class="card-item special-card">
            <img src="${green_column_0}" alt="Green Column 0" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color green">Green Column 0</span></div>
              <div class="card-desc">${t("tutorial.mechanics.colInd")}</div>
            </div>
          </div>
          
          <div class="card-item special-card">
            <img src="${green_column_1}" alt="Green Column 1" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color green">Green Column 1</span></div>
              <div class="card-desc">${t("tutorial.mechanics.colInd")}</div>
            </div>
          </div>

          <div class="card-item special-card">
            <img src="${green_column_2}" alt="Green Column 2" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color green">Green Column 2</span></div>
              <div class="card-desc">${t("tutorial.mechanics.colInd")}</div>
            </div>
          </div>

          <div class="card-item special-card">
            <img src="${brown_column}" alt="Brown Column" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color brown">Brown Column</span></div>
              <div class="card-desc">${t("tutorial.mechanics.colInd")}</div>
            </div>
          </div>

          <div class="card-item">
            <img src="${chameleonRed}" alt="Red Chameleon" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color red">Red</span></div>
              <div class="card-count">×9</div>
            </div>
          </div>
          
          <div class="card-item">
            <img src="${chameleonBlue}" alt="Blue Chameleon" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color blue">Blue</span></div>
              <div class="card-count">×9</div>
            </div>
          </div>
          
          <div class="card-item">
            <img src="${chameleonGreen}" alt="Green Chameleon" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color green">Green</span></div>
              <div class="card-count">×9</div>
            </div>
          </div>

          <div class="card-item">
            <img src="${chameleonBrown}" alt="Brown Chameleon" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color brown">Brown</span></div>
              <div class="card-count">×9</div>
            </div>
          </div>

          <div class="card-item">
            <img src="${chameleonOrange}" alt="Orange Chameleon" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color orange">Orange</span></div>
              <div class="card-count">×9</div>
            </div>
          </div>

          <div class="card-item">
            <img src="${chameleonPurple}" alt="Purple Chameleon" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color purple">Purple</span></div>
              <div class="card-count">×9</div>
            </div>
          </div>

          <div class="card-item">
            <img src="${chameleonYellow}" alt="Yellow Chameleon" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color yellow">Yellow</span></div>
              <div class="card-count">×9</div>
            </div>
          </div>
          
          <div class="card-item special-card">
            <img src="${cotton}" alt="Cotton Card" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color cotton">Cotton</span></div>
              <div class="card-count">×10</div>
              <div class="card-desc">${t("tutorial.mechanics.cottonDesc")}</div>
            </div>
          </div>
          
          <div class="card-item special-card">
            <img src="${wild}" alt="Wild Card" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color wild">Wild</span></div>
              <div class="card-count">×2</div>
              <div class="card-desc">${t("tutorial.mechanics.wildDesc")}</div>
            </div>
          </div>
          
          <div class="card-item special-card">
            <img src="${golden_wild}" alt="Golden Wild Card" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color goldenWild">Golden Wild</span></div>
              <div class="card-count">×1</div>
              <div class="card-desc">${t("tutorial.mechanics.goldenDesc")}</div>
            </div>
          </div>

          <div class="card-item special-card">
            <img src="${endRound}" alt="End Round" class="card-image" />
            <div class="card-info">
              <div class="card-title"><span class="card-color endround">End Round</span></div>
              <div class="card-count">×1</div>
              <div class="card-desc">${t(
                "tutorial.mechanics.endRoundDesc"
              )}</div>
            </div>
          </div>
        </div>
        
        <div class="cards-explanations">
          <div class="explanation-section">
            <div class="explanation-title">${t(
              "tutorial.mechanics.colExpTitle"
            )}</div>
            <div class="explanation-text">
            ${t("tutorial.mechanics.colExpText")}
            </div>
          </div>
        </div>
        </div>
      </div>
    `,
        side: "right",
        align: "center",
      },
    },
    {
      element: ".action-btn:first-child",
      popover: {
        title: t("tutorial.revealAction.title"),
        description: `
        <div class="tutorial-reveal-card">
          <div class="reveal-steps">
            <div class="reveal-step">
              <div class="step-icon">1️</div>
              <div class="step-content">
                <strong>${t("tutorial.revealAction.step1")}</strong> ${t(
          "tutorial.revealAction.step1Desc"
        )}
              </div>
            </div>
            <div class="reveal-step">
              <div class="step-icon">2️⃣</div>
              <div class="step-content">
                ${t("tutorial.revealAction.step2")}
              </div>
            </div>
            <div class="reveal-step">
              <div class="step-icon">3️⃣</div>
              <div class="step-content">
                ${t("tutorial.revealAction.step3")}
              </div>
            </div>
          </div>
          
          <div class="reveal-purpose">
            <div class="purpose-title">${t(
              "tutorial.revealAction.purposeTitle"
            )}</div>
            <div class="purpose-items">
              <div class="purpose-item">${t("tutorial.revealAction.p1")}</div>
              <div class="purpose-item">${t("tutorial.revealAction.p2")}</div>
              <div class="purpose-item">${t("tutorial.revealAction.p3")}</div>
            </div>
          </div>
        </div>
      `,
        side: "top",
        align: "center",
      },
    },
    {
      element: ".column:nth-child(1)",
      popover: {
        title: t("tutorial.demo.title"),
        description: `
      <div class="tutorial-reveal-action">
        <div class="reveal-action-demo">
          <div class="demo-title">${t("tutorial.demo.visual")}</div>
          <div class="demo-content">
            <div class="demo-before-after">
              <div class="demo-before">
                <div class="demo-label">${t("tutorial.demo.before")}</div>
                <div class="demo-column">
                  <img src="${getCardImage(
                    "brown_column"
                  )}" alt="Brown Column" class="demo-card" />
                  <img src="${getCardImage(
                    "red"
                  )}" alt="Red Card" class="demo-card" />
                  <div class="demo-card-placeholder">+ ?</div>
                </div>
              </div>
              
              <div class="demo-arrow">→</div>
              
              <div class="demo-after">
                <div class="demo-label">${t("tutorial.demo.after")}</div>
                <div class="demo-column">
                  <img src="${getCardImage(
                    "brown_column"
                  )}" alt="Brown Column" class="demo-card" />
                  <img src="${getCardImage(
                    "red"
                  )}" alt="Red Card" class="demo-card" />
                  <img src="${getCardImage(
                    "blue"
                  )}" alt="Blue Card" class="demo-card new-card" />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="reveal-action-tip">
          <div class="tip-icon">💡</div>
          <div class="tip-content">
            <strong>${t("tutorial.demo.tip")}</strong> ${t(
          "tutorial.demo.tipDesc"
        )}
          </div>
        </div>
      </div>
    `,
        side: "top",
        align: "center",
      },
    },
    {
      element: ".action-btn:nth-child(2)",
      popover: {
        title: t("tutorial.takeAction.title"),
        description: `
        <div class="tutorial-take-column">
          <div class="take-important">
            <div class="important-icon">⚠️</div>
            <div class="important-text">${t("tutorial.takeAction.warn")}</div>
          </div>
          
          <div class="take-steps">
            <div class="take-step">
              <div class="step-icon">1️⃣</div>
              <div class="step-content">
                <strong>${t("tutorial.takeAction.step1")}</strong> ${t(
          "tutorial.takeAction.step1Desc"
        )}
              </div>
            </div>
            <div class="take-step">
              <div class="step-icon">2️⃣</div>
              <div class="step-content">
                ${t("tutorial.takeAction.step2")}
              </div>
            </div>
            <div class="take-step">
              <div class="step-icon">3️⃣</div>
              <div class="step-content">
                ${t("tutorial.takeAction.step3")}
              </div>
            </div>
          </div>
          
          <div class="take-timing">
            <div class="timing-title">${t(
              "tutorial.takeAction.timingTitle"
            )}</div>
            <div class="timing-items">
              <div class="timing-item">${t("tutorial.takeAction.t1")}</div>
              <div class="timing-item">${t("tutorial.takeAction.t2")}</div>
              <div class="timing-item">${t("tutorial.takeAction.t3")}</div>
              <div class="timing-item">${t("tutorial.takeAction.t4")}</div>
            </div>
          </div>
        </div>
      `,
        side: "top",
        align: "center",
      },
    },
    {
      popover: {
        title: t("tutorial.strategy.title"),
        description: `
        <div class="tutorial-strategy">
          <div class="strategy-core">
            <div class="core-title">${t("tutorial.strategy.coreTitle")}</div>
            <div class="core-principles">
              <div class="principle">
                <div class="principle-content">
                  <strong>${t("tutorial.strategy.p1")}</strong>
                  <div class="principle-desc">${t(
                    "tutorial.strategy.p1Desc"
                  )}</div>
                </div>
              </div>
              <div class="principle">
                <div class="principle-content">
                  <strong>${t("tutorial.strategy.p2")}</strong>
                  <div class="principle-desc">${t(
                    "tutorial.strategy.p2Desc"
                  )}</div>
                </div>
              </div>
              <div class="principle">
                <div class="principle-content">
                  <strong>${t("tutorial.strategy.p3")}</strong>
                  <div class="principle-desc">${t(
                    "tutorial.strategy.p3Desc"
                  )}</div>
                </div>
              </div>
            </div>
          </div>
          
          <div class="strategy-advanced">
            <div class="advanced-title">${t("tutorial.strategy.advTitle")}</div>
            <div class="advanced-tips">
              <div class="tip">${t("tutorial.strategy.a1")}</div>
              <div class="tip">${t("tutorial.strategy.a2")}</div>
              <div class="tip">${t("tutorial.strategy.a3")}</div>
            </div>
          </div>

          <p class="takeColumn">${t("tutorial.strategy.actionText")}</p>
        </div>
      `,
        align: "center",
      },
    },
    {
      element: ".game-info-section",
      popover: {
        title: t("tutorial.gameInfo.title"),
        description: `
      <div class="tutorial-game-info">
        <div class="info-intro">
          <div class="info-title">${t("tutorial.gameInfo.statusTitle")}</div>
          <div class="info-description">
            ${t("tutorial.gameInfo.statusDesc")}
          </div>
        </div>
            
            <div class="detail-item">
              <div class="detail-text">
                <strong>${t("tutorial.gameInfo.reset")}</strong>
                <div class="detail-subtext">${t(
                  "tutorial.gameInfo.resetDesc"
                )}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="info-round-end">
          <div class="round-end-title">${t("tutorial.gameInfo.endTitle")}</div>
          <div class="round-end-conditions">
            <div class="condition">
              <div class="condition-number">1</div>
              <div class="condition-text">
                <strong>${t("tutorial.gameInfo.cond1")}</strong>
                <div class="condition-example">${t(
                  "tutorial.gameInfo.cond1Ex"
                )}</div>
              </div>
            </div>
            
            <div class="condition">
              <div class="condition-number">2</div>
              <div class="condition-text">
                <strong>${t("tutorial.gameInfo.cond2")}</strong>
                <div class="condition-example">${t(
                  "tutorial.gameInfo.cond2Ex"
                )}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="info-round-transition">
          <div class="transition-title">${t(
            "tutorial.gameInfo.transTitle"
          )}</div>
          <div class="transition-steps">
            <div class="transition-step">
              <div class="step-marker">→</div>
              <div class="step-content">${t("tutorial.gameInfo.s1")}</div>
            </div>
            <div class="transition-step">
              <div class="step-marker">→</div>
              <div class="step-content">${t("tutorial.gameInfo.s2")}</div>
            </div>
            <div class="transition-step">
              <div class="step-marker">→</div>
              <div class="step-content">${t("tutorial.gameInfo.s3")}</div>
            </div>
            <div class="transition-step">
              <div class="step-marker">→</div>
              <div class="step-content">${t("tutorial.gameInfo.s4")}</div>
            </div>
          </div>
        </div>
      </div>
    `,
        side: "right",
        align: "center",
      },
    },
  ];
};

export const getScoringSteps = (): DriveStep[] => {
  const chameleonRed = getCardImage("red");
  const chameleonBlue = getCardImage("blue");
  const chameleonGreen = getCardImage("green");
  const chameleonYellow = getCardImage("yellow");
  const cotton = getCardImage("cotton");
  const { t } = useLanguageStore.getState();

  return [
    {
      element: `.player-card[data-username="You"]`,
      popover: {
        title: t("tutorial.scoring.title"),
        description: `
        <div class="tutorial-scoring-example">
          <div class="scoring-intro">
            <strong>${t("tutorial.scoring.intro")}</strong>
          </div>
          
          <div class="scoring-cards">
            <div class="card-group">
              <div class="group-title">Red Cards </div>
              <div class="group-cards">
                <img src="${chameleonRed}" alt="Red Card" class="scoring-card" />
                <img src="${chameleonRed}" alt="Red Card" class="scoring-card" />
              </div>
            </div>
            
            <div class="card-group">
              <div class="group-title">Blue Card </div>
              <div class="group-cards">
                <img src="${chameleonBlue}" alt="Blue Card" class="scoring-card" />
              </div>
            </div>
            
            <div class="card-group">
              <div class="group-title">Green Card </div>
              <div class="group-cards">
                <img src="${chameleonGreen}" alt="Green Card" class="scoring-card" />
              </div>
            </div>
            
            <div class="card-group">
              <div class="group-title">Yellow Card </div>
              <div class="group-cards">
                <img src="${chameleonYellow}" alt="Yellow Card" class="scoring-card new" />
              </div>
            </div>
            
            <div class="card-group special">
              <div class="group-title">Cotton Card </div>
              <div class="group-cards">
                <img src="${cotton}" alt="Cotton Card" class="scoring-card special" />
              </div>
            </div>
          </div>
          
          <div class="scoring-calculation">
            <div class="calculation-step">
              <div class="step-label">${t("tutorial.scoring.top3")}</div>
              <div class="step-values">
                <div class="color-value">
                  <div class="color-dot red"></div>
                  <span class="color-name">Red:</span>
                  <span class="color-count">2 cards</span>
                </div>
                <div class="color-value">
                  <div class="color-dot green"></div>
                  <span class="color-name">Green:</span>
                  <span class="color-count">1 card</span>
                </div>
                <div class="color-value">
                  <div class="color-dot blue"></div>
                  <span class="color-name">Blue:</span>
                  <span class="color-count">1 card</span>
                </div>
                <div class="color-value">
                  <div class="color-dot yellow"></div>
                  <span class="color-name">Yellow:</span>
                  <span class="color-count">1 card</span>
                </div>
              </div>
            </div>
            
            <div class="calculation-step">
              <div class="step-label">${t("tutorial.scoring.calcLabel")}</div>
              <div class="step-values">
                <div class="point-breakdown">
                  <div class="breakdown-item">
                    <span class="item-name">Red (2 cards):</span>
                    <span class="item-value">3 points</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-name">Green (1 card):</span>
                    <span class="item-value">1 point</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-name">Blue (1 card):</span>
                    <span class="item-value">1 point</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-name">Yellow (1 card):</span>
                    <span class="item-value">-1 point</span>
                  </div>
                  <div class="breakdown-divider"></div>
                  <div class="breakdown-item">
                    <span class="item-name">${t(
                      "tutorial.scoring.subtotal"
                    )}</span>
                    <span class="item-value">4 points</span>
                  </div>
                  <div class="breakdown-item">
                    <span class="item-name">${t(
                      "tutorial.scoring.cottonBonus"
                    )}</span>
                    <span class="item-value">+2 points</span>
                  </div>
                  <div class="breakdown-divider total"></div>
                  <div class="breakdown-item total">
                    <span class="item-name">${t(
                      "tutorial.scoring.totalScore"
                    )}</span>
                    <span class="item-value">6 points</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      `,
        side: "left",
        align: "center",
      },
    },

    {
      popover: {
        title: t("tutorial.completed.title"),
        description: `
      <div class="tutorial-completed">
        <img src="${trophy}" alt="Trophy" class="completed-trophy" />
        <div class="completed-title">${t("tutorial.completed.ready")}</div>
        
        <div class="completed-skills">
          <div class="skills-title">${t("tutorial.completed.learned")}</div>
          <div class="skills-list">
            <div class="skill-item">
              <div class="skill-check">✓</div>
              <div class="skill-text">${t("tutorial.completed.l1")}</div>
            </div>
            <div class="skill-item">
              <div class="skill-check">✓</div>
              <div class="skill-text">${t("tutorial.completed.l2")}</div>
            </div>
            <div class="skill-item">
              <div class="skill-check">✓</div>
              <div class="skill-text">${t("tutorial.completed.l3")}</div>
            </div>
            <div class="skill-item">
              <div class="skill-check">✓</div>
              <div class="skill-text">${t("tutorial.completed.l4")}</div>
            </div>
          </div>
        </div>
        
        <div class="completed-action">
          <div class="action-title-final">${t(
            "tutorial.completed.actionTitle"
          )}</div>
          <div class="action-finals">
            <div class="action-final">
              <div class="step-number-final">1</div>
              <div class="step-content-final">
                <div class="step-title-final">${t(
                  "tutorial.completed.s1Title"
                )}</div>
                <div class="step-desc-final">${t(
                  "tutorial.completed.s1Desc"
                )}</div>
              </div>
            </div>
            <div class="action-final">
              <div class="step-number-final">2</div>
              <div class="step-content-final">
                <div class="step-title-final">${t(
                  "tutorial.completed.s2Title"
                )}</div>
                <div class="step-desc-final">${t(
                  "tutorial.completed.s2Desc"
                )}</div>
              </div>
            </div>
            <div class="action-final">
              <div class="step-number-final">3</div>
              <div class="step-content-final">
                <div class="step-title-final">${t(
                  "tutorial.completed.s3Title"
                )}</div>
                <div class="step-desc-final">${t(
                  "tutorial.completed.s3Desc"
                )}</div>
              </div>
            </div>
          </div>
        </div>
        
        <div class="completed-encouragement">
          <div class="encouragement-text">${t("tutorial.completed.fun")}</div>
        </div>
      </div>
    `,
        align: "center",
      },
    },
  ];
};
