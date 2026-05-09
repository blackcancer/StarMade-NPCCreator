/**
 * @fileoverview Daily trader example workspace.
 *
 * Cooldown-gated daily deal flow.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

export const dailyTrader = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "npc_greeting",
        "x": 30,
        "y": 30,
        "fields": {
          "TEXT": "Welcome! I have daily deals for trusted traders.",
          "MS": 2000
        },
        "inputs": {
          "CHOICES": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "Buy today's special item."
              },
              "inputs": {
                "ACTIONS": {
                  "block": {
                    "type": "npc_check_cooldown",
                    "fields": {
                      "ACTION_ID": "daily_deal",
                      "STATE": "expired"
                    },
                    "inputs": {
                      "THEN": {
                        "block": {
                          "type": "npc_cooldown_set",
                          "fields": {
                            "ACTION_ID": "daily_deal",
                            "DURATION_SEC": 86400,
                            "SUCCESS": "Deal recorded. Enjoy your item!"
                          }
                        }
                      },
                      "ELSE": {
                        "block": {
                          "type": "npc_send_message",
                          "fields": {
                            "TYPE": "warn",
                            "TEXT": "You already bought today's deal. Come back tomorrow!"
                          }
                        }
                      }
                    }
                  }
                }
              },
              "next": {
                "block": {
                  "type": "npc_goback",
                  "fields": {
                    "LABEL": "Maybe later."
                  }
                }
              }
            }
          }
        }
      },
      {
        "type": "npc_cooldown_set",
        "x": 600,
        "y": 30,
        "fields": {
          "ACTION_ID": "daily_deal",
          "DURATION_SEC": 86400,
          "SUCCESS": "Deal recorded."
        }
      }
    ]
  }
};
