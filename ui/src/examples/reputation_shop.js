/**
 * @fileoverview Reputation Shop example workspace.
 *
 * Advanced reputation-gated shop with persistent stock, sell transactions and loyalty rewards.
 *
 * @author InitSysRev
 * @version 1.0.0
 */

export const reputationShop = {
  "blocks": {
    "languageVersion": 0,
    "blocks": [
      {
        "type": "npc_greeting",
        "fields": {
          "TEXT": "Welcome, {name}. My wares are reserved for trusted members of {faction}.",
          "MS": 2000
        },
        "inputs": {
          "CHOICES": {
            "block": {
              "type": "npc_choice",
              "fields": {
                "LABEL": "Show me your exclusive items."
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
                          "type": "npc_say_menu",
                          "fields": {
                            "TEXT": "Excellent standing, {name}. Here is our exclusive catalog.",
                            "MS": 2000
                          },
                          "inputs": {
                            "CHOICES": {
                              "block": {
                                "type": "npc_choice",
                                "fields": {
                                  "LABEL": "Buy Elite Laser (200 000 cr)"
                                },
                                "inputs": {
                                  "ACTIONS": {
                                    "block": {
                                      "type": "npc_check_stock",
                                      "fields": {
                                        "SHOP_ID": "guild_shop",
                                        "ITEM_TYPE": 424,
                                        "OP": ">=",
                                        "VALUE": 1
                                      },
                                      "inputs": {
                                        "THEN": {
                                          "block": {
                                            "type": "npc_stock_sell",
                                            "fields": {
                                              "SHOP_ID": "guild_shop",
                                              "ITEM_TYPE": 424,
                                              "PRICE": 200000,
                                              "COUNT": 1
                                            },
                                            "inputs": {
                                              "SOLD": {
                                                "block": {
                                                  "type": "npc_rep_add",
                                                  "fields": {
                                                    "NPC_ID": "trading_guild",
                                                    "DELTA": 5
                                                  },
                                                  "next": {
                                                    "block": {
                                                      "type": "npc_send_message",
                                                      "fields": {
                                                        "TYPE": "info",
                                                        "TEXT": "Elite Laser purchased! Your loyalty earns you +5 reputation."
                                                      }
                                                    }
                                                  }
                                                }
                                              },
                                              "FAIL": {
                                                "block": {
                                                  "type": "npc_say",
                                                  "fields": {
                                                    "TEXT": "Insufficient credits or item sold out.",
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
                                              "TEXT": "This item is out of stock. Check back later.",
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
                                      "LABEL": "Buy Shield Upgrade (500 000 cr)"
                                    },
                                    "inputs": {
                                      "ACTIONS": {
                                        "block": {
                                          "type": "npc_check_stock",
                                          "fields": {
                                            "SHOP_ID": "guild_shop",
                                            "ITEM_TYPE": 512,
                                            "OP": ">=",
                                            "VALUE": 1
                                          },
                                          "inputs": {
                                            "THEN": {
                                              "block": {
                                                "type": "npc_stock_sell",
                                                "fields": {
                                                  "SHOP_ID": "guild_shop",
                                                  "ITEM_TYPE": 512,
                                                  "PRICE": 500000,
                                                  "COUNT": 1
                                                },
                                                "inputs": {
                                                  "SOLD": {
                                                    "block": {
                                                      "type": "npc_send_message",
                                                      "fields": {
                                                        "TYPE": "info",
                                                        "TEXT": "Shield Upgrade acquired. It has been added to your inventory."
                                                      }
                                                    }
                                                  },
                                                  "FAIL": {
                                                    "block": {
                                                      "type": "npc_say",
                                                      "fields": {
                                                        "TEXT": "Insufficient credits.",
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
                                                  "TEXT": "Shield Upgrades are sold out.",
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
                                          "LABEL": "Restock the shop (admin only)."
                                        },
                                        "inputs": {
                                          "ACTIONS": {
                                            "block": {
                                              "type": "npc_stock_add",
                                              "fields": {
                                                "SHOP_ID": "guild_shop",
                                                "ITEM_TYPE": 424,
                                                "QTY": 3,
                                                "SUCCESS": "Laser stock +3."
                                              },
                                              "next": {
                                                "block": {
                                                  "type": "npc_stock_add",
                                                  "fields": {
                                                    "SHOP_ID": "guild_shop",
                                                    "ITEM_TYPE": 512,
                                                    "QTY": 1,
                                                    "SUCCESS": "Shield Upgrade stock +1."
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
                                              "LABEL": "Nothing for now."
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
                      "ELSE": {
                        "block": {
                          "type": "npc_say",
                          "fields": {
                            "TEXT": "Your reputation with {faction} is too low. Earn 100 reputation to access this catalog.",
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
                    "LABEL": "What's my reputation?"
                  },
                  "inputs": {
                    "ACTIONS": {
                      "block": {
                        "type": "npc_get_rep",
                        "fields": {
                          "NPC_ID": "trading_guild",
                          "TEXT": "Your {faction} standing: %s reputation points."
                        }
                      }
                    }
                  },
                  "next": {
                    "block": {
                      "type": "npc_choice",
                      "fields": {
                        "LABEL": "How do I earn reputation?"
                      },
                      "inputs": {
                        "ACTIONS": {
                          "block": {
                            "type": "npc_say",
                            "fields": {
                              "TEXT": "Complete delivery missions, purchase exclusive items and never betray the guild.",
                              "MS": 2500
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
        "x": 900,
        "y": 30
      },
      {
        "type": "npc_stock_init",
        "fields": {
          "SHOP_ID": "guild_shop",
          "ITEM_TYPE": 512,
          "QTY": 2
        },
        "x": 900,
        "y": 120
      }
    ]
  }
};
