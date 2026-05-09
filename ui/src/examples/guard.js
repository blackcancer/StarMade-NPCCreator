/**
 * @fileoverview Reputation guard example workspace.
 *
 * Reputation check controlling access to a restricted area.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

export const guard = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "npc_greeting",
        "x": 30,
        "y": 30,
        "fields": {
          "TEXT": "Halt! State your business with the guild.",
          "MS": 2000
        },
        "inputs": {
          "CHOICES": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "I wish to enter the vault."
              },
              "inputs": {
                "ACTIONS": {
                  "block": {
                    "type": "npc_check_rep",
                    "fields": {
                      "NPC_ID": "trading_guild",
                      "OP": ">=",
                      "VALUE": 100
                    },
                    "inputs": {
                      "THEN": {
                        "block": {
                          "type": "npc_send_message",
                          "fields": {
                            "TYPE": "info",
                            "TEXT": "Access granted. Welcome."
                          }
                        }
                      },
                      "ELSE": {
                        "block": {
                          "type": "npc_send_message",
                          "fields": {
                            "TYPE": "warn",
                            "TEXT": "Your reputation is too low. Earn our trust first."
                          }
                        }
                      }
                    }
                  }
                }
              },
              "next": {
                "block": {
                  "type": "npc_choice",
                  "fields": {
                    "LABEL": "How can I improve my reputation?"
                  },
                  "inputs": {
                    "ACTIONS": {
                      "block": {
                        "type": "npc_get_rep",
                        "fields": {
                          "NPC_ID": "trading_guild",
                          "TEXT": "Your current reputation: %s"
                        }
                      }
                    }
                  },
                  "next": {
                    "block": {
                      "type": "npc_goback",
                      "fields": {
                        "LABEL": "I'll be back."
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    ]
  }
};
