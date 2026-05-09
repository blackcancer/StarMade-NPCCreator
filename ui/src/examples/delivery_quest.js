/**
 * @fileoverview Delivery Quest example workspace.
 *
 * Advanced multi-step quest with offer, objective, step tracking, completion, reward and abandon.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

export const deliveryQuest = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "npc_greeting",
        "fields": {
          "TEXT": "Greetings {name}! I'm {partner}, guild quartermaster.",
          "MS": 2000
        },
        "inputs": {
          "CHOICES": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "Tell me about the delivery mission."
              },
              "inputs": {
                "ACTIONS": {
                  "block": {
                    "type": "npc_quest_offer_advanced",
                    "fields": {
                      "QUEST_ID": "guild_delivery",
                      "OFFER_TEXT": "We need 3 crates delivered to sector 7. Reward: 25 000 credits.",
                      "ACCEPT_LABEL": "I'll do it!",
                      "REFUSE_LABEL": "Not now.",
                      "STEP": 1
                    },
                    "inputs": {
                      "ACCEPTED": {
                        "block": {
                          "type": "npc_quest_objective",
                          "fields": {
                            "QUEST_ID": "guild_delivery",
                            "TEXT": "Objective: Collect the 3 crates from the cargo bay and fly to sector 7."
                          },
                          "next": {
                            "block": {
                              "type": "npc_quest_set_step",
                              "fields": {
                                "QUEST_ID": "guild_delivery",
                                "STEP": 2
                              }
                            }
                          }
                        }
                      },
                      "REFUSED": {
                        "block": {
                          "type": "npc_say",
                          "fields": {
                            "TEXT": "Come back when you're ready.",
                            "MS": 2000
                          }
                        }
                      },
                      "ALREADY_ACTIVE": {
                        "block": {
                          "type": "npc_say",
                          "fields": {
                            "TEXT": "You already have this mission active. Deliver the crates to sector 7!",
                            "MS": 2000
                          }
                        }
                      },
                      "ALREADY_COMPLETE": {
                        "block": {
                          "type": "npc_say",
                          "fields": {
                            "TEXT": "You've already completed this mission. Thank you, Commander!",
                            "MS": 2000
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
                    "LABEL": "I've delivered the crates."
                  },
                  "inputs": {
                    "ACTIONS": {
                      "block": {
                        "type": "npc_quest_require_status",
                        "fields": {
                          "QUEST_ID": "guild_delivery",
                          "STATUS": "active"
                        },
                        "inputs": {
                          "THEN": {
                            "block": {
                              "type": "npc_quest_require_step",
                              "fields": {
                                "QUEST_ID": "guild_delivery",
                                "OP": ">=",
                                "STEP": 2
                              },
                              "inputs": {
                                "THEN": {
                                  "block": {
                                    "type": "npc_quest_complete",
                                    "fields": {
                                      "QUEST_ID": "guild_delivery",
                                      "REWARD_CREDITS": 25000,
                                      "REWARD_ITEM": 0,
                                      "REWARD_COUNT": 0
                                    },
                                    "next": {
                                      "block": {
                                        "type": "npc_quest_reward",
                                        "fields": {
                                          "SUCCESS": "Excellent work! Here's your payment and a reputation bonus.",
                                          "CREDITS": 0,
                                          "ITEM": 0,
                                          "COUNT": 0,
                                          "NPC_ID": "trading_guild",
                                          "REP_DELTA": 15,
                                          "FLAG_NAME": "delivery_done",
                                          "FLAG_VALUE": "true"
                                        }
                                      }
                                    }
                                  }
                                },
                                "ELSE": {
                                  "block": {
                                    "type": "npc_say",
                                    "fields": {
                                      "TEXT": "You haven't reached sector 7 yet. The crates must be delivered there.",
                                      "MS": 2000
                                    }
                                  }
                                }
                              }
                            }
                          },
                          "ELSE": {
                            "block": {
                              "type": "npc_say",
                              "fields": {
                                "TEXT": "You don't have an active delivery mission.",
                                "MS": 2000
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
                        "LABEL": "I need to abandon the mission."
                      },
                      "inputs": {
                        "ACTIONS": {
                          "block": {
                            "type": "npc_quest_require_status",
                            "fields": {
                              "QUEST_ID": "guild_delivery",
                              "STATUS": "active"
                            },
                            "inputs": {
                              "THEN": {
                                "block": {
                                  "type": "npc_confirm",
                                  "fields": {
                                    "TEXT": "Are you sure? You will lose all progress.",
                                    "MS": 2500,
                                    "YES_LABEL": "Yes, abandon.",
                                    "NO_LABEL": "No, I'll finish it."
                                  },
                                  "inputs": {
                                    "YES": {
                                      "block": {
                                        "type": "npc_quest_fail",
                                        "fields": {
                                          "QUEST_ID": "guild_delivery"
                                        }
                                      }
                                    }
                                  }
                                }
                              },
                              "ELSE": {
                                "block": {
                                  "type": "npc_say",
                                  "fields": {
                                    "TEXT": "You don't have an active mission to abandon.",
                                    "MS": 2000
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
        },
        "x": 30,
        "y": 30
      }
    ]
  }
};
