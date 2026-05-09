/**
 * @fileoverview Merchant example workspace.
 *
 * Classic merchant NPC with hire, shops, gate activation and goodbye choice.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

export const merchant = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "npc_greeting",
        "x": 30,
        "y": 30,
        "fields": {
          "TEXT": "Greetings {name}! I'm {partner} of {faction}.",
          "MS": 2000
        },
        "inputs": {
          "CHOICES": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "I want to join your team."
              },
              "inputs": {
                "ACTIONS": {
                  "block": {
                    "type": "npc_hire",
                    "fields": {
                      "PRICE": 50000,
                      "SUCCESS": "I'm honoured to work with you, commander!"
                    }
                  }
                }
              },
              "next": {
                "block": {
                  "type": "npc_choice",
                  "fields": {
                    "LABEL": "Buy a Laser Pistol (100 000 credits)"
                  },
                  "inputs": {
                    "ACTIONS": {
                      "block": {
                        "type": "npc_sell_item",
                        "fields": {
                          "ITEM": "laser",
                          "PRICE": 100000
                        }
                      }
                    }
                  },
                  "next": {
                    "block": {
                      "type": "npc_choice",
                      "fields": {
                        "LABEL": "Buy a Helmet (50 000 credits)"
                      },
                      "inputs": {
                        "ACTIONS": {
                          "block": {
                            "type": "npc_sell_item",
                            "fields": {
                              "ITEM": "helmet",
                              "PRICE": 50000
                            }
                          }
                        }
                      },
                      "next": {
                        "block": {
                          "type": "npc_choice",
                          "fields": {
                            "LABEL": "Activate gate at 10,0,5"
                          },
                          "inputs": {
                            "ACTIONS": {
                              "block": {
                                "type": "npc_activate_block",
                                "fields": {
                                  "X": 10,
                                  "Y": 0,
                                  "Z": 5,
                                  "STATE": "toggle"
                                }
                              }
                            }
                          },
                          "next": {
                            "block": {
                              "type": "npc_goback",
                              "fields": {
                                "LABEL": "Goodbye."
                              }
                            }
                          }
                        }
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
