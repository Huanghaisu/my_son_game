import React, { useEffect, useRef } from 'react';
import { View, StyleSheet, Animated, Easing, Dimensions } from 'react-native';

const { width } = Dimensions.get('window');

interface BattleSceneProps {
    children?: React.ReactNode;
}

export default function BattleScene({ children }: BattleSceneProps) {
    // 云朵动画
    const cloud1X = useRef(new Animated.Value(0)).current;
    const cloud2X = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        // 云朵1 向左缓慢移动
        Animated.loop(
            Animated.sequence([
                Animated.timing(cloud1X, {
                    toValue: -width,
                    duration: 35000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(cloud1X, {
                    toValue: width,
                    duration: 0,
                    useNativeDriver: true,
                }),
                Animated.timing(cloud1X, {
                    toValue: 0,
                    duration: 35000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();

        // 云朵2 向右极缓慢移动
        Animated.loop(
            Animated.sequence([
                Animated.timing(cloud2X, {
                    toValue: width,
                    duration: 45000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
                Animated.timing(cloud2X, {
                    toValue: -width,
                    duration: 0,
                    useNativeDriver: true,
                }),
                Animated.timing(cloud2X, {
                    toValue: 0,
                    duration: 45000,
                    easing: Easing.linear,
                    useNativeDriver: true,
                }),
            ])
        ).start();
    }, []);

    return (
        <View style={styles.container}>
            {/* 蓝天背景渐变替代 (纯色+光晕) */}
            <View style={styles.skyBackground}>
                <View style={styles.sunGlow} />
            </View>

            {/* 远景山脉 */}
            <View style={styles.mountainGroup}>
                <View style={[styles.mountain, styles.mountainLeft]} />
                <View style={[styles.mountain, styles.mountainRight]} />
            </View>

            {/* 动画云朵 */}
            <Animated.Text
                style={[styles.cloud, { top: '10%', left: '20%', transform: [{ translateX: cloud1X }] }]}
            >
                ☁️
            </Animated.Text>
            <Animated.Text
                style={[
                    styles.cloud,
                    { top: '25%', left: '60%', fontSize: 50, transform: [{ translateX: cloud2X }] },
                ]}
            >
                ☁️
            </Animated.Text>

            {/* 宝箱层 (静止在背景右后方) */}
            <View style={styles.treasureBoxWrapper}>
                <Animated.Text style={styles.treasureBox}>🎁</Animated.Text>
            </View>

            {/* 前景草地 */}
            <View style={styles.ground}>
                <View style={styles.grassDetail1} />
                <View style={styles.grassDetail2} />
            </View>

            {/* 内容投影插槽 (放置怪兽) */}
            <View style={styles.contentOverlay}>{children}</View>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        ...StyleSheet.absoluteFillObject,
        overflow: 'hidden',
        backgroundColor: '#87CEEB', // 蓝天
    },
    skyBackground: {
        ...StyleSheet.absoluteFillObject,
        opacity: 0.8,
    },
    sunGlow: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 250,
        height: 250,
        borderRadius: 125,
        backgroundColor: '#FFFDE7',
        opacity: 0.6,
    },
    mountainGroup: {
        position: 'absolute',
        bottom: '30%',
        width: '100%',
        height: 200,
    },
    mountain: {
        position: 'absolute',
        bottom: -50,
        width: 300,
        height: 300,
        borderRadius: 40,
        backgroundColor: '#90CAF9', // 浅蓝山脉
        transform: [{ rotate: '45deg' }],
    },
    mountainLeft: {
        left: -100,
        backgroundColor: '#64B5F6',
    },
    mountainRight: {
        right: -120,
        bottom: -80,
        backgroundColor: '#90CAF9',
    },
    cloud: {
        position: 'absolute',
        fontSize: 60,
        opacity: 0.8,
    },
    treasureBoxWrapper: {
        position: 'absolute',
        right: '15%',
        bottom: '36%',
        zIndex: 1,
    },
    treasureBox: {
        fontSize: 32,
        opacity: 0.8, // 淡淡的存在感
    },
    ground: {
        position: 'absolute',
        bottom: 0,
        width: '100%',
        height: '35%',
        backgroundColor: '#81C784', // 绿草地
        borderTopWidth: 6,
        borderTopColor: '#66BB6A',
    },
    grassDetail1: {
        position: 'absolute',
        top: 10,
        left: '20%',
        width: 20,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        opacity: 0.5,
    },
    grassDetail2: {
        position: 'absolute',
        top: 25,
        right: '30%',
        width: 30,
        height: 6,
        borderRadius: 3,
        backgroundColor: '#4CAF50',
        opacity: 0.4,
    },
    contentOverlay: {
        ...StyleSheet.absoluteFillObject,
        zIndex: 10,
    },
});
