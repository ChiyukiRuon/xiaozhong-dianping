/*
 Navicat Premium Data Transfer

 Source Server         : ChiyukiRuon
 Source Server Type    : MySQL
 Source Server Version : 50718
 Source Host           : -
 Source Schema         : -

 Target Server Type    : MySQL
 Target Server Version : 50718
 File Encoding         : 65001

 Date: 23/02/2025 19:18:05
*/

SET NAMES utf8mb4;
SET FOREIGN_KEY_CHECKS = 0;

-- ----------------------------
-- Table structure for category
-- ----------------------------
DROP TABLE IF EXISTS `category`;
CREATE TABLE `category` (
  `id` int(11) NOT NULL AUTO_INCREMENT COMMENT '类别 ID',
  `merchant` int(11) NOT NULL COMMENT '商家 ID',
  `category` varchar(255) COLLATE utf8_bin NOT NULL COMMENT '类别名',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=18 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ----------------------------
-- Table structure for food
-- ----------------------------
DROP TABLE IF EXISTS `food`;
CREATE TABLE `food` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `merchant` int(10) unsigned NOT NULL,
  `name` varchar(255) COLLATE utf8_bin NOT NULL,
  `intro` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `cover` varchar(255) COLLATE utf8_bin NOT NULL DEFAULT 'http://cdn.dianping.chiyukiruon.top/cover/default.jpg',
  `category` varchar(255) COLLATE utf8_bin DEFAULT NULL,
  `price` decimal(10,2) unsigned NOT NULL DEFAULT '0.00',
  `score` decimal(10,2) unsigned NOT NULL DEFAULT '0.00',
  `status` int(1) unsigned NOT NULL DEFAULT '1' COMMENT '0=下架，1=上架',
  `remark` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '下架备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=24 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ----------------------------
-- Table structure for permission
-- ----------------------------
DROP TABLE IF EXISTS `permission`;
CREATE TABLE `permission` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `permission` varchar(255) COLLATE utf8_bin NOT NULL,
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=5 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ----------------------------
-- Table structure for regions
-- ----------------------------
DROP TABLE IF EXISTS `regions`;
CREATE TABLE `regions` (
  `id` int(11) unsigned NOT NULL AUTO_INCREMENT,
  `p_code` varchar(50) NOT NULL DEFAULT '' COMMENT '上一级编码',
  `code` varchar(50) NOT NULL DEFAULT '' COMMENT '编码',
  `name` varchar(100) NOT NULL DEFAULT '' COMMENT '名称',
  `level` tinyint(4) NOT NULL COMMENT '级别:1-省，2-市，3-县，4-镇，5-村委会',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=846463 DEFAULT CHARSET=utf8;

-- ----------------------------
-- Table structure for review
-- ----------------------------
DROP TABLE IF EXISTS `review`;
CREATE TABLE `review` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `author_id` int(10) unsigned NOT NULL COMMENT '用户ID',
  `content` varchar(255) COLLATE utf8_bin NOT NULL COMMENT '内容',
  `parent_id` int(10) unsigned DEFAULT NULL COMMENT '回复的评论ID',
  `target_id` int(10) NOT NULL COMMENT '目标食品 ID',
  `merchant_id` int(11) NOT NULL COMMENT '美食所属商家 ID',
  `annex` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '评价图片',
  `score` decimal(2,1) unsigned DEFAULT NULL COMMENT '评分',
  `anonymity` int(1) unsigned NOT NULL DEFAULT '0' COMMENT '是否匿名',
  `status` int(1) unsigned NOT NULL DEFAULT '0' COMMENT '评论状态。0=正常，1=用户隐藏，2=违规',
  `create_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP,
  `updeta_at` timestamp NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  `remark` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '审核备注',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=30 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ----------------------------
-- Table structure for user
-- ----------------------------
DROP TABLE IF EXISTS `user`;
CREATE TABLE `user` (
  `uid` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `username` varchar(30) COLLATE utf8_bin NOT NULL COMMENT '用户名',
  `password` varchar(255) COLLATE utf8_bin NOT NULL COMMENT '密码',
  `nickname` varchar(60) COLLATE utf8_bin DEFAULT NULL COMMENT '昵称',
  `avatar` varchar(255) COLLATE utf8_bin DEFAULT 'http://cdn.dianping.chiyukiruon.top/avatar.jpg' COMMENT '头像链接',
  `intro` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '简介',
  `phone` varchar(11) COLLATE utf8_bin DEFAULT NULL COMMENT '手机号',
  `email` varchar(50) COLLATE utf8_bin DEFAULT NULL COMMENT '邮箱',
  `address` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '地址',
  `role` varchar(10) COLLATE utf8_bin NOT NULL DEFAULT 'normal' COMMENT '角色',
  `permission` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '权限。仅管理员',
  `status` int(10) unsigned NOT NULL DEFAULT '0' COMMENT '账户状态。0=正常，1=待审核，2=封禁，3=注销，4=待提交申请， 5=申请驳回',
  `remark` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '账户不可用原因',
  `annex` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '附件。仅商家',
  PRIMARY KEY (`uid`)
) ENGINE=InnoDB AUTO_INCREMENT=16 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

-- ----------------------------
-- Table structure for verification
-- ----------------------------
DROP TABLE IF EXISTS `verification`;
CREATE TABLE `verification` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `type` varchar(255) COLLATE utf8_bin NOT NULL COMMENT '内容类型。user，merchant，review',
  `detail` varchar(255) COLLATE utf8_bin NOT NULL COMMENT '违规字段',
  `source_id` int(11) NOT NULL COMMENT '源 ID',
  `status` int(10) unsigned NOT NULL DEFAULT '2' COMMENT '0=通过人工审核，1=通过第三方API审核，2=待审核，3=违规',
  `remark` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '备注',
  `annex` varchar(255) COLLATE utf8_bin DEFAULT NULL COMMENT '附件',
  PRIMARY KEY (`id`)
) ENGINE=InnoDB AUTO_INCREMENT=12 DEFAULT CHARSET=utf8 COLLATE=utf8_bin;

SET FOREIGN_KEY_CHECKS = 1;
