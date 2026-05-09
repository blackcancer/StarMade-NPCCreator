/**
 * @fileoverview Guild Faction Hub example workspace.
 *
 * Very advanced: conditional greeting by reputation, daily cooldown reward, multi-step quest, vault access with AND condition, world state events, conversation state and live stats.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

export const guildFactionHub = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "npc_cond_greeting",
        "fields": {
          "TEXT_THEN": "Welcome back, Commander {name}! The guild salutes you.",
          "MS_THEN": 2000,
          "TEXT_ELSE": "Halt, stranger. You are not yet known to this guild.",
          "MS_ELSE": 2000
        },
        "inputs": {
          "COND": {
            "block": {
              "type": "npc_cond_rep",
              "fields": {
                "NPC_ID": "trading_guild",
                "OP": ">=",
                "VALUE": 50
              }
            }
          },
          "CHOICES_THEN": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "What do you have for me today?"
              },
              "inputs": {
                "ACTIONS": {
                  "block": {
                    "type": "npc_say_menu",
                    "fields": {
                      "TEXT": "I have several things for you today, Commander.",
                      "MS": 2000
                    },
                    "inputs": {
                      "CHOICES": {
                        "block": {
                          "type": "npc_choice",
                          "fields": {
                            "LABEL": "[Daily] Collect loyalty bonus."
                          },
                          "inputs": {
                            "ACTIONS": {
                              "block": {
                                "type": "npc_check_cooldown",
                                "fields": {
                                  "ACTION_ID": "hub_daily_bonus",
                                  "STATE": "expired"
                                },
                                "inputs": {
                                  "THEN": {
                                    "block": {
                                      "type": "npc_cooldown_set",
                                      "fields": {
                                        "ACTION_ID": "hub_daily_bonus",
                                        "DURATION_SEC": 86400
                                      },
                                      "next": {
                                        "block": {
                                          "type": "npc_quest_reward",
                                          "fields": {
                                            "SUCCESS": "Daily bonus: 10 000 credits and +5 reputation!",
                                            "CREDITS": 10000,
                                            "ITEM": 0,
                                            "COUNT": 0,
                                            "NPC_ID": "trading_guild",
                                            "REP_DELTA": 5,
                                            "FLAG_NAME": "",
                                            "FLAG_VALUE": "true"
                                          }
                                        }
                                      }
                                    }
                                  },
                                  "ELSE": {
                                    "block": {
                                      "type": "npc_get_cooldown_remaining",
                                      "fields": {
                                        "ACTION_ID": "hub_daily_bonus",
                                        "TEXT": "Already collected. Come back in %s seconds."
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
                                "LABEL": "The ore survey mission."
                              },
                              "inputs": {
                                "ACTIONS": {
                                  "block": {
                                    "type": "npc_quest_offer_advanced",
                                    "fields": {
                                      "QUEST_ID": "ore_survey",
                                      "OFFER_TEXT": "Survey the ore field in sector 12. Reward: 15 000 cr + 10 reputation.",
                                      "ACCEPT_LABEL": "I'll do it.",
                                      "REFUSE_LABEL": "Not now.",
                                      "STEP": 1
                                    },
                                    "inputs": {
                                      "ACCEPTED": {
                                        "block": {
                                          "type": "npc_quest_objective",
                                          "fields": {
                                            "QUEST_ID": "ore_survey",
                                            "TEXT": "Objective: Fly to sector 12, scan the ore field, then return."
                                          },
                                          "next": {
                                            "block": {
                                              "type": "npc_set_conv_state",
                                              "fields": {
                                                "STATE": "on_ore_survey"
                                              }
                                            }
                                          }
                                        }
                                      },
                                      "REFUSED": {
                                        "block": {
                                          "type": "npc_say",
                                          "fields": {
                                            "TEXT": "Mission available whenever you're ready.",
                                            "MS": 2000
                                          }
                                        }
                                      },
                                      "ALREADY_ACTIVE": {
                                        "block": {
                                          "type": "npc_quest_require_step",
                                          "fields": {
                                            "QUEST_ID": "ore_survey",
                                            "OP": ">=",
                                            "STEP": 2
                                          },
                                          "inputs": {
                                            "THEN": {
                                              "block": {
                                                "type": "npc_quest_complete",
                                                "fields": {
                                                  "QUEST_ID": "ore_survey",
                                                  "REWARD_CREDITS": 15000,
                                                  "REWARD_ITEM": 0,
                                                  "REWARD_COUNT": 0
                                                },
                                                "next": {
                                                  "block": {
                                                    "type": "npc_quest_reward",
                                                    "fields": {
                                                      "SUCCESS": "Survey done! +10 reputation.",
                                                      "CREDITS": 0,
                                                      "ITEM": 0,
                                                      "COUNT": 0,
                                                      "NPC_ID": "trading_guild",
                                                      "REP_DELTA": 10,
                                                      "FLAG_NAME": "ore_survey_done",
                                                      "FLAG_VALUE": "true"
                                                    },
                                                    "next": {
                                                      "block": {
                                                        "type": "npc_set_conv_state",
                                                        "fields": {
                                                          "STATE": "none"
                                                        }
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
                                                  "TEXT": "Survey not complete yet. Fly to sector 12 first.",
                                                  "MS": 2000
                                                }
                                              }
                                            }
                                          }
                                        }
                                      },
                                      "ALREADY_COMPLETE": {
                                        "block": {
                                          "type": "npc_say",
                                          "fields": {
                                            "TEXT": "You've already completed the ore survey!",
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
                                    "LABEL": "Access the Commander's vault."
                                  },
                                  "inputs": {
                                    "ACTIONS": {
                                      "block": {
                                        "type": "npc_if_condition",
                                        "inputs": {
                                          "COND": {
                                            "block": {
                                              "type": "npc_cond_and",
                                              "inputs": {
                                                "A": {
                                                  "block": {
                                                    "type": "npc_cond_rep",
                                                    "fields": {
                                                      "NPC_ID": "trading_guild",
                                                      "OP": ">=",
                                                      "VALUE": 200
                                                    }
                                                  }
                                                },
                                                "B": {
                                                  "block": {
                                                    "type": "npc_cond_flag_db",
                                                    "fields": {
                                                      "FLAG_NAME": "ore_survey_done",
                                                      "VALUE": "true"
                                                    }
                                                  }
                                                }
                                              }
                                            }
                                          },
                                          "THEN": {
                                            "block": {
                                              "type": "npc_say_menu",
                                              "fields": {
                                                "TEXT": "The vault is open to you, Commander.",
                                                "MS": 2000
                                              },
                                              "inputs": {
                                                "CHOICES": {
                                                  "block": {
                                                    "type": "npc_choice",
                                                    "fields": {
                                                      "LABEL": "Buy Meta Blueprint (1 000 000 cr)"
                                                    },
                                                    "inputs": {
                                                      "ACTIONS": {
                                                        "block": {
                                                          "type": "npc_confirm",
                                                          "fields": {
                                                            "TEXT": "Purchase a Meta Blueprint for 1 000 000 credits?",
                                                            "MS": 2500,
                                                            "YES_LABEL": "Yes, purchase.",
                                                            "NO_LABEL": "No, cancel."
                                                          },
                                                          "inputs": {
                                                            "YES": {
                                                              "block": {
                                                                "type": "npc_give_meta_item",
                                                                "fields": {
                                                                  "META_TYPE": "org.schema.game.common.data.player.inventory.ItemStack",
                                                                  "SUB_TYPE": 0,
                                                                  "COST": 1000000
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
                                                          "LABEL": "Close vault."
                                                        }
                                                      }
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
                                                "TEXT": "The vault requires 200 reputation AND the ore survey completion.",
                                                "MS": 2500
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
                                        "LABEL": "What's happening in the sector?"
                                      },
                                      "inputs": {
                                        "ACTIONS": {
                                          "block": {
                                            "type": "npc_get_world",
                                            "fields": {
                                              "KEY": "sector_event",
                                              "DEFAULT": "peace",
                                              "TEXT": "Current sector status: %s"
                                            },
                                            "next": {
                                              "block": {
                                                "type": "npc_check_world",
                                                "fields": {
                                                  "KEY": "sector_event",
                                                  "OP": "==text",
                                                  "VALUE": "siege"
                                                },
                                                "inputs": {
                                                  "THEN": {
                                                    "block": {
                                                      "type": "npc_send_message",
                                                      "fields": {
                                                        "TYPE": "warn",
                                                        "TEXT": "WARNING: Sector under siege! All ships dock immediately."
                                                      }
                                                    }
                                                  },
                                                  "ELSE": {
                                                    "block": {
                                                      "type": "npc_say",
                                                      "fields": {
                                                        "TEXT": "The sector is calm. No hostilities reported.",
                                                        "MS": 2000
                                                      }
                                                    }
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
                                            "LABEL": "Show my detailed stats."
                                          },
                                          "inputs": {
                                            "ACTIONS": {
                                              "block": {
                                                "type": "npc_get_info",
                                                "fields": {
                                                  "INFO_TYPE": "credits",
                                                  "TEXT": "Credits: %s"
                                                },
                                                "next": {
                                                  "block": {
                                                    "type": "npc_get_rep",
                                                    "fields": {
                                                      "NPC_ID": "trading_guild",
                                                      "TEXT": "Guild reputation: %s"
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
                                                "LABEL": "I'm done for now."
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
                    }
                  }
                }
              }
            }
          },
          "CHOICES_ELSE": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "How do I join the guild?"
              },
              "inputs": {
                "ACTIONS": {
                  "block": {
                    "type": "npc_say",
                    "fields": {
                      "TEXT": "Earn 50 reputation by completing public missions for guild members.",
                      "MS": 2000
                    }
                  }
                }
              },
              "next": {
                "block": {
                  "type": "npc_choice",
                  "fields": {
                    "LABEL": "What's my reputation?"
                  },
                  "inputs": {
                    "ACTIONS": {
                      "block": {
                        "type": "npc_get_rep",
                        "fields": {
                          "NPC_ID": "trading_guild",
                          "TEXT": "Your guild reputation: %s points."
                        }
                      }
                    }
                  },
                  "next": {
                    "block": {
                      "type": "npc_goback",
                      "fields": {
                        "LABEL": "I'll come back stronger."
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
      },
      {
        "type": "npc_stock_init",
        "fields": {
          "SHOP_ID": "guild_shop",
          "ITEM_TYPE": 424,
          "QTY": 5
        },
        "x": 950,
        "y": 30
      }
    ]
  }
};
